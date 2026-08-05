import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="site-title">
        <span className="site-title-emoji" aria-hidden="true">
          🏈
        </span>{' '}
        AFC North Recap
      </Link>
      <p className="site-tagline">Weekly poems, delivered fashionably late every Monday.</p>
    </header>
  )
}
