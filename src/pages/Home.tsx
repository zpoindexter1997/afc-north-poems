import { poems } from '../lib/poems'
import PoemCard from '../components/PoemCard'

export default function Home() {
  const [latest, ...rest] = poems

  if (!latest) {
    return (
      <main className="container">
        <p className="empty-state">No poems yet — the first recap is coming soon.</p>
      </main>
    )
  }

  return (
    <main className="container">
      <section>
        <h2 className="section-label">Latest</h2>
        <PoemCard poem={latest} featured />
      </section>
      {rest.length > 0 && (
        <section>
          <h2 className="section-label">Archive</h2>
          <div className="poem-grid">
            {rest.map((poem) => (
              <PoemCard key={poem.slug} poem={poem} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
