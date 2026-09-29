import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import TopBar from './components/TopBar/TopBar'
import BottomNav from './components/BottomNav/BottomNav'
import HomePage from './pages/HomePage'
import NewWorkoutPage from './pages/NewWorkoutPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'
import WorkoutHistoryPage from './pages/WorkoutHistoryPage'
import WorkoutDetailsPage from './pages/WorkoutDetailsPage'
import AuthScreen from './pages/AuthScreen'
import { useAuth } from './auth/useAuth'
import './App.css'
import './styles/pages.css'

export default function App() {
  const { session, loading } = useAuth()
  if (loading) return <div className="auth-loading"><div className="auth-spinner"/><span>Restoring your session…</span></div>
  if (!session) return <AuthScreen />
  return (
    <BrowserRouter>
      <div className="app-shell">
        <TopBar />
        <main className="page-shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/workouts/new" element={<NewWorkoutPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/workouts" element={<WorkoutHistoryPage />} />
            <Route path="/workouts/:id" element={<WorkoutDetailsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
