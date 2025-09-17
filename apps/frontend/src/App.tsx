import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])
  return (
    <button
      onClick={() => {
        const next = !dark
        setDark(next)
        localStorage.setItem('theme', next ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark', next)
      }}
      className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}

function NavLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation()
  const active = loc.pathname === to
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md ${active ? 'bg-gray-200 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
      {label}
    </Link>
  )
}

export default function App() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 p-4 space-y-2">
        <div className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          Marketing Hub
        </div>
        <nav className="space-y-1">
          <NavLink to="/" label="Home" />
          <NavLink to="/chat" label="Ask AI" />
          <NavLink to="/charts" label="Create Chart" />
          <NavLink to="/insights" label="Competitor Insights" />
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">AB Palette — Primary #006DA8 • Links #007ABB</div>
          <ThemeToggle />
        </header>
        <section className="p-6 overflow-auto flex-1">
          <Outlet />
        </section>
      </main>
    </div>
  )
}

