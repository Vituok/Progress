import { Link } from 'react-router-dom'
import useWorkouts from '../hooks/useWorkouts'
import { buildWorkoutSummary } from '../utils/workoutMetrics'
import { formatShortDate, formatSetCompact } from '../utils/formatters'

export default function HomePage() {
  const { workouts, loading, error, reload } = useWorkouts()
  const summary = buildWorkoutSummary(workouts)
  const lastWorkout = workouts[0] || null
  const recent = summary.recentImprovement
  const achievements = [
    workouts.length >= 1 && { title: 'First workout', detail: 'Your first saved session' },
    workouts.length >= 10 && { title: 'Ten sessions', detail: '10 workouts completed' },
    summary.uniqueExercises >= 3 && { title: 'Training variety', detail: '3 exercises recorded' },
  ].filter(Boolean)

  return <section className="page data-page home-dashboard">
    <div className="home-heading"><div><p className="eyebrow">Fitness progress</p><h1 className="page-title">Ready to train?</h1></div><span>{summary.totalWorkouts} saved {summary.totalWorkouts === 1 ? 'workout' : 'workouts'}</span></div>
    {error && <div className="status error">{error} <button type="button" onClick={reload}>Try again</button></div>}
    <section className="card start-card"><div><p className="eyebrow">Today’s session</p><h2>Build your next workout</h2><p>Choose exercises and log only the sets you complete.</p></div><Link className="primary-button" to="/workouts/new">Start workout <span>→</span></Link></section>
    {loading ? <p className="status">Loading your dashboard…</p> : <div className="dashboard-grid">
      <section className="card dashboard-section last-workout-card"><div className="section-card-head"><h2>Last workout</h2>{lastWorkout && <Link to="/workouts">History</Link>}</div>{lastWorkout ? <Link className="last-workout-content" to={`/workouts/${lastWorkout.id}`}><div><strong>{formatShortDate(lastWorkout.performedAt)}</strong><span>{lastWorkout.exercises.length} {lastWorkout.exercises.length === 1 ? 'exercise' : 'exercises'}</span></div><div className="last-exercises">{lastWorkout.exercises.slice(0, 3).map((exercise) => <p key={exercise.workoutExerciseId}><b>{exercise.name}</b><span>{exercise.sets.map((set) => formatSetCompact(set, exercise.metricType)).join(' · ')}</span></p>)}</div></Link> : <EmptyState title="No workouts yet" copy="Your latest saved workout will appear here." />}</section>
      <section className="card dashboard-section"><div className="section-card-head"><h2>Recent result</h2><Link to="/progress">Progress</Link></div>{recent ? <div className="result-content"><p className="metric-label">{recent.name}</p><strong>{recent.recentLabel}</strong>{recent.improvement > 0 ? <span className="positive">+{Math.round(recent.improvement).toLocaleString()} from previous session</span> : <span className="muted">Latest recorded performance</span>}</div> : <EmptyState title="No results yet" copy="Results are calculated from saved sets." />}</section>
      <section className="card dashboard-section"><div className="section-card-head"><h2>Achievements</h2></div>{achievements.length ? <div className="achievement-list">{achievements.map((item) => <div key={item.title}><i>✓</i><p><strong>{item.title}</strong><span>{item.detail}</span></p></div>)}</div> : <EmptyState title="No achievements yet" copy="Complete your first workout to get started." />}</section>
      <section className="card dashboard-section"><div className="section-card-head"><h2>Current goal</h2></div><EmptyState title="No goal set" copy="Goal settings will be available here." /></section>
    </div>}
  </section>
}

function EmptyState({ title, copy }) { return <div className="small-empty"><span>—</span><div><strong>{title}</strong><p>{copy}</p></div></div> }
