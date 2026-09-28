import { requireUser,supabase } from './supabase'

const EXAMPLES=[['Pull-ups','reps'],['Push-ups','reps'],['Seated Cable Row','weight_reps'],['Handstand','duration']]
const mapExercise=row=>({id:row.id,name:row.name,metricType:row.metric_type})

export async function getExercises(){
  const user=await requireUser()
  let {data,error}=await supabase.from('exercises').select('id,name,metric_type').eq('user_id',user.id).order('name')
  if(error) throw error
  if(!data.length){
    const result=await supabase.from('exercises').insert(EXAMPLES.map(([name,metric_type])=>({user_id:user.id,name,metric_type}))).select('id,name,metric_type')
    if(result.error) throw result.error
    data=result.data
  }
  return data.map(mapExercise).sort((a,b)=>a.name.localeCompare(b.name))
}

export async function createExercise({name,metricType}){
  const user=await requireUser()
  const {data,error}=await supabase.from('exercises').insert({user_id:user.id,name:name.trim(),metric_type:metricType}).select('id,name,metric_type').single()
  if(error) throw error
  return mapExercise(data)
}
