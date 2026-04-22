import { useNavigate } from 'react-router-dom'

export default function StatCard({ label, value, sub, icon: Icon, color = 'indigo', to }) {
  const navigate = useNavigate()

  return (
    <div 
      className="card stat-card" 
      onClick={to ? () => navigate(to) : undefined}
      style={to ? { cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' } : undefined}
      onMouseEnter={to ? (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.15)' } : undefined}
      onMouseLeave={to ? (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' } : undefined}
    >
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
