import { Link } from 'react-router-dom'
import { formatShortDate,formatSetCompact } from '../../utils/formatters'
import './WorkoutCard.css'
export default function WorkoutCard({workout}){return <Link className="workout-card card" to={`/workouts/${workout.id}`}><div><p className="workout-date">{formatShortDate(workout.performedAt)}</p>{workout.exercises.map(ex=><div className="workout-summary" key={ex.workoutExerciseId}><strong>{ex.name}</strong><span>{ex.sets.map(s=>formatSetCompact(s,ex.metricType)).join(' · ')}</span></div>)}</div><span className="arrow">→</span></Link>}
