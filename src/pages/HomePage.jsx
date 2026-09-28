import { Link } from 'react-router-dom'

const points = [
  { x: 8, y: 72, label: '1,440', date: 'Aug 8' },
  { x: 36, y: 26, label: '2,505', date: 'Aug 22' },
  { x: 64, y: 55, label: '1,900', date: 'Sep 1' },
  { x: 94, y: 14, label: '2,730', date: 'Sep 21' },
]

function TrendChart() {
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ')
  return <div className="trend-chart" aria-label="Training volume increased from 1,440 to 2,730 pounds">
    <div className="chart-y"><span>3,000</span><span>2,500</span><span>2,000</span><span>1,500</span><span>1,000</span></div>
    <div className="chart-plot">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="chartGlow" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#b8ff35"/><stop offset="1" stopColor="#8df40f"/></linearGradient></defs>
        <g className="grid-lines"><path d="M0 10H100M0 30H100M0 50H100M0 70H100M0 90H100"/></g>
        <polyline points={polyline} fill="none" stroke="url(#chartGlow)" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
      </svg>
      {points.map((point) => <div key={point.date} className="point-label" style={{left:`${point.x}%`,top:`${point.y}%`}}><b>{point.label}</b><span>{point.date}</span></div>)}
    </div>
  </div>
}

function MetricIcon({ type }) {
  return type === 'trophy' ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v5M8 20h8M10 17h4"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18V12M12 18V5M19 18V9"/></svg>
}

export default function HomePage(){return <section className="progress-page">
  <div className="workout-hero"><div className="hero-copy"><p className="hero-kicker">Pull · Control · Grow</p><h1>Seated<br/>Cable Row</h1></div><div className="hero-quote">Strength<br/>builds a<br/>stronger<br/>back<span/></div></div>
  <section className="dashboard-card chart-card"><h2>Training volume <small>(lb)</small></h2><TrendChart /></section>
  <div className="metric-grid">
    <section className="dashboard-card metric-card"><div className="metric-icon"><MetricIcon type="trophy"/></div><div><p>Top weight</p><strong>100 <small>lb</small></strong></div></section>
    <section className="dashboard-card metric-card"><div className="metric-icon"><MetricIcon type="bars"/></div><div><p>Best volume</p><strong>2,730 <small>lb</small></strong></div></section>
  </div>
  <section className="dashboard-card latest-card"><div className="latest-heading"><div className="calendar-icon"><span/><span/><b>23</b></div><h2>Latest session</h2><Link to="/workouts">View all</Link></div><div className="set-grid"><div><span>Set 1</span><strong>85 lb</strong><small>18 reps</small></div><div><span>Set 2</span><strong>100 lb</strong><small>12 reps</small></div><div className="session-total"><span>Total</span><strong>30</strong><small>reps</small></div></div></section>
</section>}
