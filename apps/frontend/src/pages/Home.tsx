import { Link } from 'react-router-dom'

const Card = ({ title, to }: { title: string; to: string }) => (
  <Link
    to={to}
    className="block rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition"
  >
    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>
      {title}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">Get started →</p>
  </Link>
)

export default function Home() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card title="Ask AI" to="/chat" />
      <Card title="Create Chart" to="/charts" />
      <Card title="Competitor Insights" to="/insights" />
    </div>
  )
}

