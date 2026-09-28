import pullUpsImage from '../../assets/exercises/pull-ups.png'
import pushUpsImage from '../../assets/exercises/push-ups.png'
import handstandImage from '../../assets/exercises/handstand.png'
import cableRowImage from '../../assets/exercises/seated-cable-row.png'
import './ExerciseSelector.css'

const featuredExercises = [
  { name: 'Pull-ups', image: pullUpsImage },
  { name: 'Push-ups', image: pushUpsImage },
  { name: 'Handstand', image: handstandImage },
  { name: 'Seated Cable Row', image: cableRowImage },
]

const normalize = (name) => name.trim().toLocaleLowerCase()

export default function ExerciseSelector({ exercises, value, onSelect }) {
  const featuredNames = new Set(featuredExercises.map((item) => normalize(item.name)))
  const customExercises = exercises.filter((exercise) => !featuredNames.has(normalize(exercise.name)))

  return <section className="exercise-picker" aria-labelledby="exercise-picker-title">
    <div className="exercise-picker-heading">
      <div><p className="eyebrow">Choose exercise</p><h2 id="exercise-picker-title">What are you training?</h2></div>
      <span>Select a card to start logging</span>
    </div>
    <div className="exercise-options">
      {featuredExercises.map((featured) => {
        const exercise = exercises.find((item) => normalize(item.name) === normalize(featured.name))
        const selected = exercise?.id === value
        return <button
          className={`exercise-option${selected ? ' selected' : ''}`}
          type="button"
          key={featured.name}
          aria-pressed={selected}
          aria-label={`Select ${featured.name}`}
          disabled={!exercise}
          onClick={() => exercise && onSelect(exercise)}
        >
          <img src={featured.image} alt="" />
          <span className="exercise-option-shade" />
          {selected && <span className="selected-mark" aria-hidden="true">✓</span>}
        </button>
      })}
    </div>
    {customExercises.length > 0 && <div className="custom-exercise-options"><span>Your exercises</span><div>{customExercises.map((exercise) => <button type="button" className={exercise.id === value ? 'selected' : ''} aria-pressed={exercise.id === value} key={exercise.id} onClick={() => onSelect(exercise)}>{exercise.name}</button>)}</div></div>}
  </section>
}
