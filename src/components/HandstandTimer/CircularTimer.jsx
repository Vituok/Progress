export default function CircularTimer({ progress, children, success = false, size = 520 }) {
  const radius = 118
  const circumference = 2 * Math.PI * radius
  const value = Math.max(0, Math.min(1, progress))
  return <div className={`circular-timer${success ? ' success' : ''}`} style={{'--timer-size': `${size}px`}}>
    <svg viewBox="0 0 260 260" aria-hidden="true">
      <circle className="timer-track" cx="130" cy="130" r={radius}/>
      <circle className="timer-progress" cx="130" cy="130" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value)}/>
    </svg>
    <div className="timer-center">{children}</div>
  </div>
}
