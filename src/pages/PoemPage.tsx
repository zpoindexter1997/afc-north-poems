import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { poems, getPoemBySlug } from '../lib/poems'
import { TEAM_INFO, formatDate } from '../lib/teams'

export default function PoemPage() {
  const { slug } = useParams<{ slug: string }>()
  useEffect(() => { window.scrollTo(0, 0) }, [slug])
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
  const position = poems.findIndex(entry => entry.slug === poem.slug)
  const previous = poems[position + 1]
  const next = poems[position - 1]
  const readingMinutes = Math.max(1, Math.ceil(poem.body.trim().split(/\s+/).length / 180))

  return (
    <main className="container reading-page">
      <Link to="/" className="back-link">
        ← All recaps
      </Link>
      <article className={`poem-full theme-${poem.accentTeam}`}>
        <header className="poem-heading">
        <div className="poem-edition">The Sunday aftermath <span aria-hidden="true">/</span> Week {String(poem.week).padStart(2, '0')} · {poem.season}</div>
        <div className="poem-card-meta">
          <span className="team-badge">{poem.accentTeam === 'mixed' ? 'Around the division' : `Weekly spotlight · ${team.name}`}</span>
          <span>
            {readingMinutes} min read
          </span>
          {poem.date && <span> · {formatDate(poem.date)}</span>}
        </div>
        <h1 className="poem-full-title">{poem.title}</h1>
        {poem.matchup && <p className="poem-card-matchup">{poem.matchup}</p>}
        <p className="poem-byline">From the desk of<br /><strong>Zha'Quon &quot;Z&quot; Poindexter</strong></p>
        </header>
        <div className="verse-ornament" aria-hidden="true"><span />✦<span /></div>
        <pre className="poem-body">{poem.body}</pre>
        {poem.images.length > 0 && (
          <section className="poem-gallery" aria-label="Images from this recap">
            <h2 className="gallery-heading">The postgame reel <span>Scenes from this recap</span></h2>
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
        <div className="poem-signoff"><span aria-hidden="true">Z.</span><p className="signoff-name">Zha'Quon &quot;Z&quot; Poindexter</p><p>Four teams. Zero neutral opinions.</p><span className="end-mark" aria-hidden="true">END OF RECAP</span></div>
      </article>
      <nav className="reading-nav" aria-label="Continue reading">
        {previous ? <Link to={`/poem/${previous.slug}`}><span>← Previous recap · {previous.season} / W{previous.week}</span><strong>{previous.title}</strong></Link> : <span className="reading-boundary">You’ve reached the first recap.</span>}
        {next ? <Link to={`/poem/${next.slug}`}><span>Next recap → · {next.season} / W{next.week}</span><strong>{next.title}</strong></Link> : <span className="reading-boundary">You’re all caught up. See you next week.</span>}
      </nav>
    </main>
  )
}
