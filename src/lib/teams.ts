import type { Team } from '../types'

export const TEAM_INFO: Record<Team, { name: string; primary: string; secondary: string; emoji: string }> = {
  ravens: { name: 'Ravens', primary: '#241773', secondary: '#9E7C0C', emoji: '\u{1F426}‍⬛' },
  bengals: { name: 'Bengals', primary: '#FB4F14', secondary: '#000000', emoji: '\u{1F42F}' },
  browns: { name: 'Browns', primary: '#EB3300', secondary: '#311D00', emoji: '\u{1F436}' },
  steelers: { name: 'Steelers', primary: '#FFB612', secondary: '#101820', emoji: '⚙️' },
  mixed: { name: 'AFC North', primary: '#4A4A4A', secondary: '#FFB612', emoji: '\u{1F3C8}' },
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
