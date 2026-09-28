import { requireUser,supabase } from './supabase'

const mapWorkout=row=>({
  id:row.id,
  performedAt:row.performed_at,
  exercises:[...(row.workout_exercises||[])].sort((a,b)=>a.position-b.position).map(item=>({
    workoutExerciseId:item.id,
    exerciseId:item.exercise.id,
    name:item.exercise.name,
    metricType:item.exercise.metric_type,
    sets:[...(item.sets||[])].sort((a,b)=>a.position-b.position).map(set=>({id:set.id,position:set.position,reps:set.reps,weight:set.weight,durationSeconds:set.duration_seconds}))
  }))
})
const selection='id,performed_at,workout_exercises(id,position,exercise:exercises(id,name,metric_type),sets(id,position,reps,weight,duration_seconds))'

export async function createWorkout({performedAt,exercises}){
  await requireUser()
  const payload={performed_at:new Date(performedAt).toISOString(),exercises:exercises.map(ex=>({exercise_id:ex.exerciseId,sets:ex.sets.map(s=>({reps:s.reps===''?null:Number(s.reps),weight:s.weight===''?null:Number(s.weight),duration_seconds:s.durationSeconds===''?null:Number(s.durationSeconds)}))}))}
  const {data,error}=await supabase.rpc('create_workout', {payload})
  if(error) throw error
  return data
}
export async function getWorkouts(){await requireUser();const {data,error}=await supabase.from('workouts').select(selection).order('performed_at',{ascending:false});if(error)throw error;return data.map(mapWorkout)}
export async function getWorkout(id){await requireUser();const {data,error}=await supabase.from('workouts').select(selection).eq('id',id).single();if(error)throw error;return mapWorkout(data)}
export const workoutService={createWorkout,getWorkouts,getWorkout}
