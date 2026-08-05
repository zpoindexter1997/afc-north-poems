import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import PoemPage from './pages/PoemPage'

export default function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/poem/:slug" element={<PoemPage />} />
      </Routes>
      <footer className="site-footer">
        Est. {new Date().getFullYear()} · A Monday tradition (Tuesdays after MNF)
      </footer>
    </div>
  )
}
