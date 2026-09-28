import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
console.log('Supabase URL:', url)
export const isSupabaseConfigured = Boolean(url && anonKey)
export const supabase = isSupabaseConfigured ? createClient(url,anonKey) : null

export async function requireUser(){
  if(!supabase) throw new Error('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.')
  const {data:{session}}=await supabase.auth.getSession()
  if(session?.user) return session.user
  const {data,error}=await supabase.auth.signInAnonymously()
  if(error) throw new Error(`Could not start a session. Enable Anonymous Sign-Ins in Supabase. ${error.message}`)
  return data.user
}

export const getCurrentUser=()=>requireUser()
export async function logout(){if(!supabase)return;const {error}=await supabase.auth.signOut();if(error)throw error}
