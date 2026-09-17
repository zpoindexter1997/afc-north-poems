import { useState } from 'react'
import { Link } from 'react-router-dom'
import { poems } from '../lib/poems'
import PoemCard from '../components/PoemCard'
import DivisionBanner from '../components/DivisionBanner'

export default function Home() {
  const [latest] = poems
  const seasons = [...new Set(poems.map(poem => poem.season))]
  const [season, setSeason] = useState(seasons[0])
  const seasonPoems = poems.filter(poem => poem.season === season)
  return (
    <main className="container">
      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow author-byline">Weekly verse by <span>Zha'Quon &quot;Z&quot; Poindexter</span></div>
        <div className="hero-heading"><h1 id="hero-title">Four teams.<br />One <em>beautiful mess.</em></h1><p>Big hits. Bad beats. A little verse.<br />Your weekly love letter to football’s<br className="desktop-break" /> most dysfunctional division.</p></div>
      </section>
      {latest ? <section className="latest-section" aria-labelledby="latest-label">
        <div className="section-heading"><h2 id="latest-label" className="section-label">Fresh off the field</h2><span>The latest edition</span></div>
        <PoemCard poem={latest} featured />
      </section> : <p className="empty-state">No poems yet — the first recap is coming soon.</p>}
      <section className="division-story" aria-label="Four cities, one division">
        <figure className="division-art"><img src={`${import.meta.env.BASE_URL}images/north-cities.png`} alt="Pittsburgh’s gold bridges, Baltimore’s purple harbor, Cincinnati’s tiger stripes, and Cleveland’s industrial waterfront, with a football and poetry pages." width="2172" height="724" loading="lazy" /><figcaption>Four cities. A whole lot of history. Absolutely no love lost.</figcaption></figure>
        <DivisionBanner />
      </section>
      <aside className="author-note" aria-label="About the column">
        <div><span className="section-label">From Z’s desk</span><h2>Four teams. Zero neutral opinions.</h2><p>A weekly AFC North recap, told in verse. Every team gets its lines. One gets the spotlight. And yes, there’s a little black and gold between the words.</p></div>
        <div className="author-signature"><span aria-hidden="true">Z.</span><strong>Zha'Quon &quot;Z&quot; Poindexter</strong><small>A Monday tradition. Tuesdays after MNF.</small></div>
      </aside>
      {seasons.length > 0 && <section className="archive-section" aria-labelledby="archive-label">
        <div className="section-heading"><h2 id="archive-label" className="section-label">The season shelves</h2><span>{poems.length} recaps & counting</span></div>
        <div className="season-picker" role="group" aria-label="Choose a season">{seasons.map(year => <button key={year} type="button" aria-pressed={season === year} onClick={() => setSeason(year)}>{year}<span>{poems.filter(poem => poem.season === year).length} recaps</span></button>)}</div>
        <p className="archive-summary" aria-live="polite">{season} season · {seasonPoems.length} {seasonPoems.length === 1 ? 'recap' : 'recaps'}</p>
        <nav className="week-selector" aria-label={`${season} week shortcuts`}>{seasonPoems.map(poem => <Link key={poem.slug} to={`/poem/${poem.slug}`} title={poem.title}>W{poem.week}{poem.slug.endsWith('pt2') ? ' · II' : ''}</Link>)}</nav>
        <div className="poem-grid">{seasonPoems.map(poem => <PoemCard key={poem.slug} poem={poem} />)}</div>
      </section>}
    </main>
  )
}
