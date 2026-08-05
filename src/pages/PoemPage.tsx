import { Link, useParams } from 'react-router-dom'
import { getPoemBySlug } from '../lib/poems'
import { TEAM_INFO, formatDate } from '../lib/teams'

export default function PoemPage() {
  const { slug } = useParams<{ slug: string }>()
  const poem = slug ? getPoemBySlug(slug) : undefined

  if (!poem) {
    return (
      <main className="container">
        <p className="empty-state">Couldn't find that poem.</p>
        <Link to="/" className="back-link">
          ← Back home
        </Link>
      </main>
    )
  }

  const team = TEAM_INFO[poem.accentTeam]

  return (
    <main className="container">
      <Link to="/" className="back-link">
        ← All recaps
      </Link>
      <article className="poem-full" style={{ borderColor: team.primary }}>
        <div className="poem-card-meta" style={{ color: team.primary }}>
          <span>
            {team.emoji} Week {poem.week} · {poem.season}
          </span>
          {poem.date && <span> · {formatDate(poem.date)}</span>}
        </div>
        <h1 className="poem-full-title">{poem.title}</h1>
        {poem.matchup && <p className="poem-card-matchup">{poem.matchup}</p>}
        <pre className="poem-body">{poem.body}</pre>
        {poem.images.length > 0 && (
          <section className="poem-gallery" aria-label="Images from this recap">
            {poem.images.map((src, i) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="poem-gallery-item"
              >
                <img src={src} alt={`${poem.title} — image ${i + 1}`} loading="lazy" />
              </a>
            ))}
          </section>
        )}
      </article>
    </main>
  )
}
