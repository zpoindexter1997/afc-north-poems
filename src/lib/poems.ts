import type { Poem, Team } from '../types'

// Minimal frontmatter parser — no external dependency needed for a
// lightweight site like this. Expects:
//
// ---
// key: value
// ---
//
// poem body...
function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw.trim() }
  const [, frontmatter, body] = match
  const data: Record<string, string> = {}
  frontmatter.split('\n').forEach((line) => {
    const idx = line.indexOf(':')
    if (idx === -1) return
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[key] = value
  })
  return { data, content: body.trim() }
}

const modules = import.meta.glob('/content/poems/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function slugFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.md$/, '')
}

const VALID_TEAMS: Team[] = ['ravens', 'bengals', 'browns', 'steelers', 'mixed']

export const poems: Poem[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw)
    const accentTeam = VALID_TEAMS.includes(data.accentTeam as Team) ? (data.accentTeam as Team) : 'mixed'
    return {
      slug: slugFromPath(path),
      title: data.title ?? 'Untitled',
      week: Number(data.week ?? 0),
      season: Number(data.season ?? new Date().getFullYear()),
      date: data.date ?? '',
      matchup: data.matchup ?? '',
      accentTeam,
      body: content,
    }
  })
  .sort((a, b) => b.season - a.season || b.week - a.week)

export function getPoemBySlug(slug: string): Poem | undefined {
  return poems.find((p) => p.slug === slug)
}
