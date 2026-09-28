import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import TopBar from './components/TopBar/TopBar'
import BottomNav from './components/BottomNav/BottomNav'
import HomePage from './pages/HomePage'
import NewWorkoutPage from './pages/NewWorkoutPage'
import WorkoutHistoryPage from './pages/WorkoutHistoryPage'
import WorkoutDetailsPage from './pages/WorkoutDetailsPage'
import './App.css'
import './styles/pages.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <TopBar />
        <main className="page-shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/workouts/new" element={<NewWorkoutPage />} />
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
