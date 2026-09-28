const number = (value) => value == null ? 0 : Number(value) || 0

function sessionValue(metricType, sets) {
  if (metricType === 'weight_reps') return sets.reduce((sum, set) => sum + number(set.weight) * number(set.reps), 0)
  if (metricType === 'duration') return sets.reduce((sum, set) => sum + number(set.durationSeconds), 0)
  return sets.reduce((sum, set) => sum + number(set.reps), 0)
}

function formatValue(value, metricType) {
  if (metricType === 'weight_reps') return `${Math.round(value).toLocaleString()} lb volume`
  if (metricType === 'duration') return `${Math.round(value).toLocaleString()} sec`
  return `${Math.round(value).toLocaleString()} reps`
}

export function buildExerciseProgress(workouts) {
  const exercises = new Map()
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const current = exercises.get(exercise.exerciseId) || {
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        metricType: exercise.metricType,
        sessions: [],
        bestWeight: 0,
        bestReps: 0,
        bestDuration: 0,
        bestSetVolume: 0,
        totalVolume: 0,
        totalReps: 0,
        totalDuration: 0,
      }
      const value = sessionValue(exercise.metricType, exercise.sets)
      current.sessions.push({ workoutId: workout.id, performedAt: workout.performedAt, value, sets: exercise.sets })
      for (const set of exercise.sets) {
        const reps = number(set.reps)
        const weight = number(set.weight)
        const duration = number(set.durationSeconds)
        current.bestReps = Math.max(current.bestReps, reps)
        current.bestWeight = Math.max(current.bestWeight, weight)
        current.bestDuration = Math.max(current.bestDuration, duration)
        current.bestSetVolume = Math.max(current.bestSetVolume, reps * weight)
        current.totalVolume += reps * weight
        current.totalReps += reps
        current.totalDuration += duration
      }
      exercises.set(exercise.exerciseId, current)
    }
  }
  return [...exercises.values()].map((exercise) => {
    const sessions = exercise.sessions.sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))
    const recent = sessions[0]?.value || 0
    const previous = sessions[1]?.value || 0
    return {
      ...exercise,
      sessions,
      sessionCount: sessions.length,
      recent,
      improvement: previous ? recent - previous : null,
      recentLabel: formatValue(recent, exercise.metricType),
      points: [...sessions].reverse().map((session) => ({ date: session.performedAt, value: session.value })),
    }
  }).sort((a, b) => new Date(b.sessions[0].performedAt) - new Date(a.sessions[0].performedAt))
}

export function buildWorkoutSummary(workouts) {
  const exercises = buildExerciseProgress(workouts)
  const recentImprovement = exercises.find((exercise) => exercise.improvement > 0) || exercises[0] || null
  return {
    totalWorkouts: workouts.length,
    personalRecords: exercises.length,
    exercises,
    recentImprovement,
    uniqueExercises: exercises.length,
  }
}
