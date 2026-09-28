import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ExerciseSelector from '../components/ExerciseSelector/ExerciseSelector'
import ExerciseCard from '../components/ExerciseCard/ExerciseCard'
import HandstandTimer from '../components/HandstandTimer/HandstandTimer'
import useExercises from '../hooks/useExercises'
import { createWorkout } from '../services/workoutService'

const today = () => new Date().toLocaleDateString('en-CA')
const blankSet = () => ({ localId: crypto.randomUUID(), reps: '', weight: '', durationSeconds: '' })

function isPositiveNumber(value) {
  return value !== '' && Number.isFinite(Number(value)) && Number(value) > 0
}

function isValidSet(set, metricType) {
  if (metricType === 'duration') return isPositiveNumber(set.durationSeconds)
  if (metricType === 'weight_reps') {
    return isPositiveNumber(set.reps) && set.weight !== '' && Number.isFinite(Number(set.weight)) && Number(set.weight) >= 0
  }
  return isPositiveNumber(set.reps)
}

function hasValidSet(item) {
  return item.sets.some((set) => isValidSet(set, item.metricType))
}

function cleanWorkoutItems(items) {
  return items
    .map((item) => ({ ...item, sets: item.sets.filter((set) => isValidSet(set, item.metricType)) }))
    .filter((item) => item.sets.length > 0)
}

export default function NewWorkoutPage() {
  const navigate = useNavigate()
  const { exercises, loading, error, addExercise } = useExercises()
  const [items, setItems] = useState([])
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [date, setDate] = useState(today())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newExercise, setNewExercise] = useState({ name: '', metricType: 'reps' })
  const [handstandModeOpen, setHandstandModeOpen] = useState(false)

  const savableItems = useMemo(() => cleanWorkoutItems(items), [items])
  const selectedItem = items.find((item) => item.exerciseId === selectedExerciseId)

  useEffect(() => {
    if (!selectedExerciseId || selectedItem?.trackingType === 'timer') return undefined
    const frame = requestAnimationFrame(() => {
      const editor = document.getElementById(`exercise-${selectedExerciseId}`)
      if (!editor) return
      const bounds = editor.getBoundingClientRect()
      const comfortablyVisible = bounds.top >= 16 && bounds.bottom <= window.innerHeight - 106
      if (!comfortablyVisible) {
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        editor.scrollIntoView({ behavior, block: 'start' })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [selectedExerciseId, selectedItem?.trackingType])

  function selectExercise(exercise) {
    setSaveError('')
    setSelectedExerciseId(exercise.id)
    const timerBased = exercise.name.trim().toLocaleLowerCase() === 'handstand'
    if (timerBased) setHandstandModeOpen(true)
    setItems((current) => {
      const withoutEmptyDrafts = current.filter((item) => item.exerciseId === exercise.id || hasValidSet(item))
      if (withoutEmptyDrafts.some((item) => item.exerciseId === exercise.id)) return withoutEmptyDrafts
      return [...withoutEmptyDrafts, {
        exerciseId: exercise.id,
        name: exercise.name,
        metricType: exercise.metricType,
        trackingType: timerBased ? 'timer' : exercise.metricType,
        sets: timerBased ? [] : [blankSet()],
      }]
    })
  }

  function closeHandstand() {
    setHandstandModeOpen(false)
    setSelectedExerciseId('')
    setItems((current) => current.filter((item) => item.trackingType !== 'timer' || hasValidSet(item)))
  }

  function patchItem(exerciseId, update) {
    setItems((current) => current.map((item) => item.exerciseId === exerciseId ? update(item) : item))
  }

  function removeItem(exerciseId) {
    setItems((current) => current.filter((item) => item.exerciseId !== exerciseId))
    if (selectedExerciseId === exerciseId) setSelectedExerciseId('')
  }

  async function createNew(event) {
    event.preventDefault()
    try {
      setSaveError('')
      const exercise = await addExercise(newExercise)
      setNewExercise({ name: '', metricType: 'reps' })
      setShowCreate(false)
      selectExercise(exercise)
    } catch (err) {
      setSaveError(err.message)
    }
  }

  async function save() {
    const exercisesToSave = cleanWorkoutItems(items)
    if (!exercisesToSave.length) {
      setSaveError('Enter at least one valid set before saving the workout.')
      return
    }
    try {
      setSaving(true)
      setSaveError('')
      const id = await createWorkout({ performedAt: `${date}T12:00:00`, exercises: exercisesToSave })
      navigate(`/workouts/${id}`, { state: { saved: true } })
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function saveHandstand(finalDurationMs) {
    const durationSeconds = (finalDurationMs / 1000).toFixed(1)
    const setNumber = (selectedItem?.sets.length ?? 0) + 1
    setItems((current) => current.map((item) => {
      if (item.exerciseId !== selectedExerciseId) return item
      return { ...item, sets: [...item.sets, { ...blankSet(), durationSeconds }] }
    }))
    return setNumber
  }

  return <section className="page">
    {handstandModeOpen && selectedItem?.trackingType === 'timer' && <HandstandTimer onClose={closeHandstand} onSave={saveHandstand} />}
    <p className="eyebrow">New session</p>
    <h1 className="page-title">Build your workout</h1>
    <div className="field date-field"><label htmlFor="performed">Workout date</label><input id="performed" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
    {error && <p className="status error">{error}</p>}
    {loading ? <p className="status">Loading exercises…</p> : <>
      <ExerciseSelector exercises={exercises} value={selectedExerciseId} onSelect={selectExercise} />
      <button className="new-exercise-toggle" type="button" onClick={() => setShowCreate((visible) => !visible)}>{showCreate ? 'Cancel' : '+ Create a new exercise'}</button>
      {showCreate && <form className="create-exercise card" onSubmit={createNew}>
        <div className="field"><label htmlFor="new-name">Exercise name</label><input id="new-name" value={newExercise.name} onChange={(event) => setNewExercise({ ...newExercise, name: event.target.value })} required /></div>
        <div className="field"><label htmlFor="metric">Tracking type</label><select id="metric" value={newExercise.metricType} onChange={(event) => setNewExercise({ ...newExercise, metricType: event.target.value })}><option value="reps">Reps</option><option value="weight_reps">Weight + reps</option><option value="duration">Duration</option></select></div>
        <button className="secondary-button" type="submit">Create exercise</button>
      </form>}
    </>}
    <div className="stack workout-builder">{items.filter((item) => item.trackingType !== 'timer').map((item) => <ExerciseCard
      key={item.exerciseId}
      item={item}
      active={item.exerciseId === selectedExerciseId}
      onAddSet={() => patchItem(item.exerciseId, (current) => ({ ...current, sets: [...current.sets, blankSet()] }))}
      onRemoveSet={(setIndex) => patchItem(item.exerciseId, (current) => ({ ...current, sets: current.sets.filter((_, index) => index !== setIndex) }))}
      onUpdateSet={(setIndex, key, value) => patchItem(item.exerciseId, (current) => ({ ...current, sets: current.sets.map((set, index) => index === setIndex ? { ...set, [key]: value } : set) }))}
      onRemove={() => removeItem(item.exerciseId)}
    />)}</div>
    {!items.length && !loading && <div className="empty-state"><p className="muted">Choose an exercise above to start logging sets.</p></div>}
    {saveError && <p className="status error">{saveError}</p>}
    <button className="primary-button full-width" type="button" disabled={saving || !savableItems.length} onClick={save}>{saving ? 'Saving workout…' : 'Save workout'}</button>
  </section>
}
