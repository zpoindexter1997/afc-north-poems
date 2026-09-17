import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="site-title">AFC North <em>Recap</em></Link>
      <span className="site-tagline">Z’s weekly column <span aria-hidden="true">/</span> AFC North, in verse.</span>
    </header>
  )
}
