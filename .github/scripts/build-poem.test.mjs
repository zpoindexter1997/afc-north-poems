import test from 'node:test'
import assert from 'node:assert/strict'
import { copyFile, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { attachmentUrl, buildPoem, downloadPhoto, imageExtension, photoUrls } from './build-poem.mjs'

const first = 'https://github.com/user-attachments/assets/11111111-1111-1111-1111-111111111111'
const second = 'https://github.com/user-attachments/assets/22222222-2222-2222-2222-222222222222'
const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
const data = { week: '5', season: '2026', date: '2026-10-06', title: 'Z’s "North"', matchup: '_No response_', accentTeam: 'ravens', poem: 'First line,\nSecond line.\n\nNext stanza.' }
const okFetch = async () => new Response(gif)

async function workspace(t) {
  const root = await mkdtemp(join(tmpdir(), 'poem-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}

test('accepts Markdown, GitHub HTML, legacy URLs, and deduplicates in order', () => {
  const legacy = 'https://user-images.githubusercontent.com/123/photo.png'
  assert.deepEqual(photoUrls(`![game](${first})\n<img width="800" src="${second}" />\n${first}\n${legacy}`), [first, second, legacy])
  assert.deepEqual(photoUrls('_No response_'), [])
  assert.deepEqual(photoUrls(''), [])
})

test('rejects unsupported sources, credentials, unfinished uploads, and excessive counts', () => {
  for (const url of ['http://github.com/user-attachments/assets/123', 'https://localhost/image.png', 'https://github.com.evil.test/image.png', 'https://github.com/owner/repo', 'https://user:pass@user-images.githubusercontent.com/a', 'https://user-images.githubusercontent.com:444/a']) {
    assert.throws(() => attachmentUrl(url))
  }
  assert.throws(() => photoUrls('Uploading photo.png...'))
  assert.throws(() => photoUrls(Array.from({ length: 11 }, (_, i) => `https://user-images.githubusercontent.com/123/${i}.png`).join('\n')))
})

test('downloads extensionless attachments and validates redirected hosts', async () => {
  let calls = 0
  const photo = await downloadPhoto(first, async (url, options) => {
    assert.equal(options.redirect, 'manual')
    assert.equal(options.headers, undefined, 'No credentials are forwarded')
    if (++calls === 1) return new Response(null, { status: 302, headers: { location: 'https://private-user-images.githubusercontent.com/123/image?token=test' } })
    return new Response(gif)
  })
  assert.equal(photo.extension, 'gif')
  assert.equal(calls, 2)
  await assert.rejects(downloadPhoto(first, async () => new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/private' } })))
  await assert.rejects(downloadPhoto(first, async () => new Response(null, { status: 302, headers: { location: first } })), /too many/)
})

test('rejects broken links, HTML/SVG, and oversized bodies with or without length headers', async () => {
  await assert.rejects(downloadPhoto(first, async () => new Response('Not found', { status: 404 })), /HTTP 404/)
  await assert.rejects(downloadPhoto(first, async () => new Response('<html>sign in</html>')), /supported image/)
  assert.throws(() => imageExtension(Buffer.from('<svg></svg>')))
  await assert.rejects(downloadPhoto(first, async () => new Response(gif, { headers: { 'content-length': String(11 * 1024 * 1024) } })), /10 MB/)
  await assert.rejects(downloadPhoto(first, async () => new Response(Buffer.alloc(10 * 1024 * 1024 + 1))), /10 MB/)
})

test('publishes without photos, preserving stanza line breaks and quoted metadata', async t => {
  const root = await workspace(t)
  assert.deepEqual(await buildPoem(data, root), { slug: '2026-week-05', photoCount: 0 })
  const text = await readFile(join(root, 'content/poems/2026-week-05.md'), 'utf8')
  assert.ok(text.endsWith(data.poem + '\n'))
  assert.ok(text.includes('accentTeam: ravens'))
  assert.ok(text.includes('matchup: ""'))
  assert.equal(JSON.parse(text.split('\n')[1].slice(7)), data.title)
})

test('updates photos in field order, is repeatable, and preserves imported photos', async t => {
  const root = await workspace(t)
  const dir = join(root, 'content/poems/media/2026-week-05')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, '01.jpeg'), 'original import')
  const fetcher = async url => new Response(Buffer.concat([gif, Buffer.from(url === first ? 'first' : 'second')]))
  const submission = { ...data, photos: `![two](${second})\n![one](${first})` }
  await buildPoem(submission, root, fetcher)
  await buildPoem(submission, root, fetcher)
  assert.deepEqual((await readdir(dir)).sort(), ['01.jpeg', 'issue-photo-01.gif', 'issue-photo-02.gif'])
  assert.ok((await readFile(join(dir, 'issue-photo-01.gif'))).toString().endsWith('second'))
  await buildPoem({ ...data, photos: first }, root, fetcher)
  assert.deepEqual((await readdir(dir)).sort(), ['01.jpeg', 'issue-photo-01.gif'])
  await buildPoem({ ...data, photos: '_No response_' }, root)
  assert.deepEqual(await readdir(dir), ['01.jpeg'])
})

test('failed download leaves previously published text and photos untouched', async t => {
  const root = await workspace(t)
  await buildPoem({ ...data, photos: first }, root, okFetch)
  const file = join(root, 'content/poems/2026-week-05.md')
  const original = await readFile(file, 'utf8')
  let count = 0
  await assert.rejects(buildPoem({ ...data, poem: 'Changed', photos: `${first}\n${second}` }, root, async () => ++count === 1 ? new Response(gif) : new Response('oops', { status: 403 })))
  assert.equal(await readFile(file, 'utf8'), original)
  assert.deepEqual(await readFile(join(root, 'content/poems/media/2026-week-05/issue-photo-01.gif')), gif)
})

test('rejects unsafe metadata and invalid dates before writes', async t => {
  const root = await workspace(t)
  for (const invalid of [{ season: '../../2026' }, { week: '5; echo bad' }, { date: '2026-02-30' }, { title: 'Title\naccentTeam: evil' }, { poem: '' }, { accentTeam: 'invalid' }]) {
    await assert.rejects(buildPoem({ ...data, ...invalid }, root))
  }
  assert.deepEqual(await readdir(root), [])
})

test('accepts issue parser text wrappers and dropdown arrays', async t => {
  const root = await workspace(t)
  const wrapped = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, { text: value }]))
  wrapped.accentTeam = ['steelers']
  assert.equal((await buildPoem(wrapped, root)).slug, '2026-week-05')
})

test('enforces the combined size limit before writing', async t => {
  const root = await workspace(t)
  const bytes = Buffer.alloc(9 * 1024 * 1024)
  gif.copy(bytes)
  const photos = Array.from({ length: 6 }, (_, i) => `https://user-images.githubusercontent.com/123/${i}.gif`).join('\n')
  await assert.rejects(buildPoem({ ...data, photos }, root, async () => new Response(bytes)), /50 MB/)
  assert.deepEqual(await readdir(root), [])
})

test('uploaded photos load into the real gallery model with the GitHub Pages base path', async t => {
  const { createServer } = await import('vite')
  const root = await workspace(t)
  await mkdir(join(root, 'src/lib'), { recursive: true })
  await copyFile(new URL('../../src/lib/poems.ts', import.meta.url), join(root, 'src/lib/poems.ts'))
  await buildPoem({ ...data, photos: `${second}\n${first}` }, root, okFetch)
  const server = await createServer({ root, configFile: false, base: '/afc-north-poems/', server: { middlewareMode: true, watch: null } })
  try {
    const { poems } = await server.ssrLoadModule('/src/lib/poems.ts')
    assert.equal(poems.length, 1)
    assert.equal(poems[0].title, data.title)
    assert.equal(poems[0].body, data.poem)
    assert.equal(poems[0].accentTeam, 'ravens')
    assert.deepEqual(poems[0].images, [
      '/afc-north-poems/content/poems/media/2026-week-05/issue-photo-01.gif',
      '/afc-north-poems/content/poems/media/2026-week-05/issue-photo-02.gif',
    ])
  } finally { await server.close() }
})
