import { Link } from 'react-router-dom'
import type { Poem } from '../types'
import { TEAM_INFO, formatDate } from '../lib/teams'

export default function PoemCard({ poem, featured = false }: { poem: Poem; featured?: boolean }) {
  const team = TEAM_INFO[poem.accentTeam]

  return (
    <Link
      to={`/poem/${poem.slug}`}
      className={`poem-card${featured ? ' poem-card-featured' : ''}`}
      style={{ borderColor: team.primary }}
    >
      <div className="poem-card-meta" style={{ color: team.primary }}>
        <span>
          {team.emoji} Week {poem.week} · {poem.season}
        </span>
        {poem.date && <span> · {formatDate(poem.date)}</span>}
      </div>
      <h3 className="poem-card-title">{poem.title}</h3>
      {poem.matchup && <p className="poem-card-matchup">{poem.matchup}</p>}
      {featured && (
        <p className="poem-card-excerpt">{poem.body.split('\n').slice(0, 3).join('\n')}…</p>
      )}
    </Link>
  )
}
