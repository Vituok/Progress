import { Link } from 'react-router-dom'
import './TopBar.css'
export default function TopBar(){return <header className="topbar"><button className="menu-button" aria-label="Open menu"><i/><i/><i/></button><Link className="brand" to="/"><span>FITNESS</span> PROGRESS</Link><Link className="stats-button" aria-label="Workout history" to="/workouts"><i/><i/><i/></Link></header>}
