import { requireUser,supabase } from './supabase'

const EXAMPLES=[['Pull-ups','reps'],['Push-ups','reps'],['Seated Cable Row','weight_reps'],['Handstand','duration'],['Leg Extension','weight_reps'],['Leg Curl','weight_reps'],['Chest Decline','weight_reps']]
const mapExercise=row=>({id:row.id,name:row.name,metricType:row.metric_type})

export async function getExercises(){
  const user=await requireUser()
  let {data,error}=await supabase.from('exercises').select('id,name,metric_type').eq('user_id',user.id).order('name')
  if(error) throw error
  const existingNames=new Set(data.map(item=>item.name.trim().toLocaleLowerCase()))
  const missing=EXAMPLES.filter(([name])=>!existingNames.has(name.toLocaleLowerCase()))
  if(missing.length){
    const result=await supabase.from('exercises').upsert(missing.map(([name,metric_type])=>({user_id:user.id,name,metric_type})),{onConflict:'user_id,name',ignoreDuplicates:true})
    if(result.error) throw result.error
    const refreshed=await supabase.from('exercises').select('id,name,metric_type').eq('user_id',user.id).order('name')
    if(refreshed.error) throw refreshed.error
    data=refreshed.data
  }
  return data.map(mapExercise).sort((a,b)=>a.name.localeCompare(b.name))
}

export async function createExercise({name,metricType}){
  const user=await requireUser()
  const {data,error}=await supabase.from('exercises').insert({user_id:user.id,name:name.trim(),metric_type:metricType}).select('id,name,metric_type').single()
  if(error) throw error
  return mapExercise(data)
}
