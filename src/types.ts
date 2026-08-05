export type Team = 'ravens' | 'bengals' | 'browns' | 'steelers' | 'mixed'

export interface Poem {
  slug: string
  title: string
  week: number
  season: number
  date: string
  matchup: string
  accentTeam: Team
  body: string
  images: string[]
}
