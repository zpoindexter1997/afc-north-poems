import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const MAX_PHOTOS = 10
const MAX_BYTES = 10 * 1024 * 1024
const MAX_TOTAL_BYTES = 50 * 1024 * 1024
const TEAMS = new Set(['ravens', 'bengals', 'browns', 'steelers', 'mixed'])

function field(data, key, fallback = '') {
  let value = data[key]
  if (value && typeof value === 'object' && !Array.isArray(value)) value = value.text
  if (Array.isArray(value)) value = value[0]
  const text = String(value ?? '').trim()
  return !text || text === '_No response_' ? fallback : text
}

// Only GitHub-hosted attachments; never fetch arbitrary issue-supplied hosts.
export function attachmentUrl(value, redirect = false) {
  const url = new URL(value)
  const host = url.hostname.toLowerCase()
  const githubAsset = host === 'github.com' && /^\/user-attachments\/assets\/[a-f0-9-]+$/i.test(url.pathname)
  const imageHost = host === 'user-images.githubusercontent.com' || host === 'private-user-images.githubusercontent.com'
  const assetRedirect = redirect && (host.endsWith('.githubusercontent.com') || host === 'github-production-user-asset-6210df.s3.amazonaws.com')
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !(githubAsset || imageHost || assetRedirect)) {
    throw new Error('Photos must be uploaded to this GitHub issue. Use its attachment picker instead of external image links.')
  }
  return url.href
}

export function photoUrls(text) {
  if (!text.trim() || text.trim() === '_No response_') return []
  // GitHub emits Markdown images or HTML <img> tags; both contain these URLs.
  const matches = text.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? []
  if (!matches.length) throw new Error('No uploaded image links found in the photos field. Wait for the uploads to finish.')
  const urls = [...new Set(matches.map(value => attachmentUrl(value.replaceAll('&amp;', '&'))))]
  if (urls.length > MAX_PHOTOS) throw new Error('Please attach no more than 10 photos.')
  return urls
}

// GitHub's upload UI is available in both textareas. Treat embedded images as
// reel attachments rather than passing their HTML/Markdown into the plain verse.
export function extractPoemPhotos(text) {
  const urls = []
  const take = value => {
    urls.push(attachmentUrl(value.replaceAll('&amp;', '&')))
    return ''
  }
  const body = text.replace(/<img\b[^>]*>|!\[[^\]]*\]\(\s*<?https?:\/\/[^\s)>]+>?(?:\s+["'][^"']*["'])?\s*\)/gi, markup => {
    const html = /^<img\b/i.test(markup)
    const url = html
      ? markup.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]
      : markup.match(/\]\(\s*<?(https?:\/\/[^\s)>]+)/i)?.[1]
    if (!url) throw new Error('An image in the poem has an invalid attachment link. Please reattach it using GitHub.')
    return take(url)
  }).replace(/^[ \t]*<?(https:\/\/(?:github\.com\/user-attachments\/assets\/|(?:private-)?user-images\.githubusercontent\.com\/)[^\s<>]+)>?[ \t]*$/gm, (_, url) => take(url))
  return { body: body.trim(), urls }
}

export function imageExtension(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg'
  if (bytes.length >= 13 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) return 'gif'
  if (bytes.length >= 16 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  throw new Error('An attachment is not a supported image. Use PNG, JPG, GIF, or WebP (not SVG, video, or a webpage).')
}

export async function downloadPhoto(value, fetcher = fetch) {
  let url = attachmentUrl(value)
  for (let redirects = 0; redirects <= 5; redirects++) {
    const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(30000) })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel()
      const location = response.headers.get('location')
      if (!location) throw new Error('An image download returned an invalid redirect.')
      url = attachmentUrl(new URL(location, url).href, true)
      continue
    }
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`An image could not be downloaded (HTTP ${response.status}). Reattach it to this issue and try again.`)
    }
    if (Number(response.headers.get('content-length')) > MAX_BYTES) {
      await response.body?.cancel()
      throw new Error('Each photo must be 10 MB or smaller.')
    }
    if (!response.body) throw new Error('An image download was empty.')
    const chunks = []
    let size = 0
    for await (const chunk of response.body) {
      size += chunk.length
      if (size > MAX_BYTES) throw new Error('Each photo must be 10 MB or smaller.')
      chunks.push(chunk)
    }
    const bytes = Buffer.concat(chunks)
    return { bytes, extension: imageExtension(bytes) }
  }
  throw new Error('An image download redirected too many times. Please reattach it.')
}

export async function buildPoem(data, root = process.cwd(), fetcher = fetch) {
  const week = field(data, 'week')
  const season = field(data, 'season')
  const date = field(data, 'date')
  const title = field(data, 'title')
  const matchup = field(data, 'matchup')
  const accent = field(data, 'accentTeam', 'mixed').toLowerCase()
  const { body: poem, urls: inlinePhotos } = extractPoemPhotos(field(data, 'poem'))
  if (!/^\d{1,2}$/.test(week) || Number(week) < 1 || Number(week) > 30) throw new Error('Week must be a number from 1 to 30.')
  if (!/^\d{4}$/.test(season)) throw new Error('Season must be a four-digit year.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Date must be a real date in YYYY-MM-DD format.')
  if (!title || /[\r\n]/.test(title + matchup)) throw new Error('Enter a title and keep title/matchup on one line.')
  if (!poem) throw new Error('The poem cannot be empty.')
  if (!TEAMS.has(accent)) throw new Error('Choose a valid team spotlight.')
  const slug = `${season}-week-${String(Number(week)).padStart(2, '0')}`
  const photos = []
  let total = 0
  const urls = [...new Set([...inlinePhotos, ...photoUrls(field(data, 'photos'))])]
  if (urls.length > MAX_PHOTOS) throw new Error('Please attach no more than 10 photos across the poem and photos fields.')
  // Finish all downloads before touching an existing poem or its photos.
  for (const url of urls) {
    const photo = await downloadPhoto(url, fetcher)
    total += photo.bytes.length
    if (total > MAX_TOTAL_BYTES) throw new Error('Combined photos must be 50 MB or smaller.')
    photos.push(photo)
  }
  const poemsDir = join(root, 'content', 'poems')
  const mediaDir = join(poemsDir, 'media', slug)
  await mkdir(poemsDir, { recursive: true })
  const existing = await readdir(mediaDir).catch(error => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  if (photos.length) await mkdir(mediaDir, { recursive: true })
  // Own only issue-photo-* files. Never remove images imported from Word docs.
  for (const name of existing.filter(name => /^issue-photo-\d+\.(png|jpg|gif|webp)$/.test(name))) await unlink(join(mediaDir, name))
  for (const [index, photo] of photos.entries()) {
    await writeFile(join(mediaDir, `issue-photo-${String(index + 1).padStart(2, '0')}.${photo.extension}`), photo.bytes)
  }
  const metadata = ['---', `title: ${JSON.stringify(title)}`, `week: ${Number(week)}`, `season: ${season}`, `date: ${date}`, `matchup: ${JSON.stringify(matchup)}`, `accentTeam: ${accent}`, '---', '']
  await writeFile(join(poemsDir, `${slug}.md`), metadata.join('\n') + '\n' + poem + '\n', 'utf8')
  return { slug, photoCount: photos.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await buildPoem(JSON.parse(process.env.JSON_STRING))
    await writeFile(process.env.GITHUB_OUTPUT, `slug=${result.slug}\nphoto_count=${result.photoCount}\n`, { flag: 'a' })
    console.log(`Prepared ${result.slug} with ${result.photoCount} issue photos.`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
