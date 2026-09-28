import { useCallback,useEffect,useState } from 'react'
import { getWorkouts } from '../services/workoutService'
export default function useWorkouts(){const [workouts,setWorkouts]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const load=useCallback(async()=>{try{setLoading(true);setError('');setWorkouts(await getWorkouts())}catch(e){setError(e.message)}finally{setLoading(false)}},[]);useEffect(()=>{queueMicrotask(load)},[load]);return{workouts,loading,error,reload:load}}
