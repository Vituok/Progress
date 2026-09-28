import { useEffect, useRef } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const angleAt = (event, element) => {
  const rect = element.getBoundingClientRect()
  return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI
}
const normalizeDelta = (delta) => ((delta + 540) % 360) - 180

export default function TimeRewindDial({ rawMs, finalMs, onChange }) {
  const dialRef = useRef(null)
  const lastAngleRef = useRef(0)
  const finalRef = useRef(finalMs)
  useEffect(() => { finalRef.current = finalMs }, [finalMs])
  const correction = rawMs - finalMs
  const handleAngle = -90 - (correction / 60000) * 360

  function pointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId)
    lastAngleRef.current = angleAt(event, dialRef.current)
  }
  function pointerMove(event) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const nextAngle = angleAt(event, dialRef.current)
    const delta = normalizeDelta(nextAngle - lastAngleRef.current)
    lastAngleRef.current = nextAngle
    const nextValue = clamp(finalRef.current + delta / 360 * 60000, 0, rawMs)
    finalRef.current = nextValue
    onChange(Math.round(nextValue / 100) * 100)
  }

  return <div className="rewind-dial" ref={dialRef} onPointerDown={pointerDown} onPointerMove={pointerMove} role="slider" aria-label="Adjust final handstand time" aria-valuemin="0" aria-valuemax={Math.round(rawMs / 100)} aria-valuenow={Math.round(finalMs / 100)} tabIndex="0">
    <svg viewBox="0 0 260 260" aria-hidden="true"><circle className="dial-track" cx="130" cy="130" r="112"/><circle className="dial-correction" cx="130" cy="130" r="112" pathLength="1" strokeDasharray={`${Math.min(1, correction / 60000)} 1`}/>{Array.from({length: 60}, (_, index) => <line key={index} x1="130" y1="13" x2="130" y2={index % 5 === 0 ? '25' : '20'} transform={`rotate(${index * 6} 130 130)`}/>)}</svg>
    <div className="dial-handle" style={{transform:`rotate(${handleAngle}deg) translateY(-112px)`}}/>
    <div className="dial-copy"><b>↶</b><strong>Drag to adjust</strong><span>Turn counterclockwise</span></div>
  </div>
}
