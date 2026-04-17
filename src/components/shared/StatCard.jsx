export default function StatCard({ label, value, sub, icon: Icon, color = 'indigo' }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}
