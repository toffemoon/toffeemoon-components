import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Index from './pages/Index.jsx'
import Detail from './pages/Detail.jsx'

export default function App() {
  const [query, setQuery] = useState('')

  return (
    <div className="shell">
      <Sidebar query={query} setQuery={setQuery} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Index query={query} />} />
          <Route path="/c/:cat/:slug" element={<Detail />} />
        </Routes>
      </main>
    </div>
  )
}
