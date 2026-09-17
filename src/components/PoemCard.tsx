import { Link } from 'react-router-dom'

import type { Poem } from '../types'
import { TEAM_INFO, formatDate } from '../lib/teams'

export default function PoemCard({ poem, featured = false }: { poem: Poem; featured?: boolean }) {
  const team = TEAM_INFO[poem.accentTeam]
  const blocks = poem.body.trim().split(/\r?\n\s*\r?\n/)
  const opening = blocks.find(block => block.split(/\r?\n/).length >= 3) ?? blocks[0] ?? ''
  const excerpt = opening.split(/\r?\n/).slice(0, 6).join('\n')
  return (
    <Link to={`/poem/${poem.slug}`} className={`poem-card theme-${poem.accentTeam}${featured ? ' poem-card-featured' : ''}`}>
      {featured && <div className="edition-number" aria-hidden="true"><span>WEEK</span><strong>{String(poem.week).padStart(2, '0')}</strong><span>{poem.season} SEASON</span></div>}
      <div className="poem-card-content">
        <div className="poem-card-meta"><span className="team-badge">{poem.accentTeam === 'mixed' ? 'Around the division' : `Weekly spotlight · ${team.name}`}</span><span>Week {poem.week} · {poem.season}</span>{poem.date && <span>{formatDate(poem.date)}</span>}</div>
        <h3 className="poem-card-title">{poem.title}</h3>
        {poem.matchup && <p className="poem-card-matchup">{poem.matchup}</p>}
        {featured && <p className="poem-card-excerpt">{excerpt}</p>}
        <span className="read-link">{featured ? 'Read this week’s recap' : 'Read poem'} <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  )
}
