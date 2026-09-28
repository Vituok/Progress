import useWorkouts from '../hooks/useWorkouts'
import { buildWorkoutSummary } from '../utils/workoutMetrics'
import { formatShortDate } from '../utils/formatters'

const metric = (label, value, suffix = '') => <div className="progress-stat"><span>{label}</span><strong>{value || '—'}{value ? suffix : ''}</strong></div>

function ExerciseProgressCard({ exercise }) {
  const primaryBest = exercise.metricType === 'duration'
    ? `${exercise.bestDuration} sec`
    : exercise.metricType === 'weight_reps'
      ? `${exercise.bestWeight} lb`
      : `${exercise.bestReps} reps`
  return <article className="card exercise-progress-card">
    <div className="progress-card-head"><div><p className="metric-label">{exercise.metricType.replace('_', ' + ')}</p><h2>{exercise.name}</h2></div><span>{exercise.sessionCount} {exercise.sessionCount === 1 ? 'session' : 'sessions'}</span></div>
    <div className="mini-trend" aria-label={`${exercise.name} progress over time`}>
      {exercise.points.map((point, index) => {
        const max = Math.max(...exercise.points.map((item) => item.value), 1)
        return <div key={`${point.date}-${index}`} className="trend-column"><i style={{height: `${Math.max(8, point.value / max * 100)}%`}}/><span>{formatShortDate(point.date).replace(/, \d{4}/, '')}</span></div>
      })}
    </div>
    <div className="progress-stats">
      {metric('Personal best', primaryBest)}
      {exercise.metricType !== 'duration' && metric('Best reps', exercise.bestReps, ' reps')}
      {exercise.metricType === 'weight_reps' && metric('Best set', Math.round(exercise.bestSetVolume), ' lb')}
      {exercise.metricType === 'weight_reps' && metric('Total volume', Math.round(exercise.totalVolume).toLocaleString(), ' lb')}
      {exercise.metricType === 'reps' && metric('Total reps', exercise.totalReps, ' reps')}
      {exercise.metricType === 'duration' && metric('Total time', exercise.totalDuration, ' sec')}
      {metric('Recent performance', exercise.recentLabel)}
    </div>
  </article>
}

export default function ProgressPage() {
  const { workouts, loading, error, reload } = useWorkouts()
  const summary = buildWorkoutSummary(workouts)
  return <section className="page data-page">
    <p className="eyebrow">Your progress</p><h1 className="page-title">Progress</h1><p className="subtitle">Records and trends calculated from your saved workouts.</p>
    <div className="summary-grid"><div className="card summary-card"><span>Total workouts</span><strong>{summary.totalWorkouts}</strong></div><div className="card summary-card"><span>Personal records</span><strong>{summary.personalRecords}</strong></div></div>
    {loading && <p className="status">Loading progress…</p>}
    {error && <div className="status error">{error} <button type="button" onClick={reload}>Try again</button></div>}
    {!loading && !error && !summary.exercises.length && <div className="card progress-empty"><div className="zero-chart"><i/><i/><i/><i/></div><h2>No progress data yet</h2><p className="muted">Complete and save a workout to start building exercise history.</p></div>}
    <div className="stack progress-list">{summary.exercises.map((exercise) => <ExerciseProgressCard key={exercise.exerciseId} exercise={exercise} />)}</div>
  </section>
}
