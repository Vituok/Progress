import { useEffect, useRef, useState } from 'react'
import handstandImage from '../../assets/exercises/handstand.png'
import CircularTimer from './CircularTimer'
import TimeRewindDial from './TimeRewindDial'
import './HandstandTimer.css'

const delayOptions = [3, 5, 10]
const goalOptions = [0, 15000, 30000, 45000, 60000]
const formatTime = (milliseconds, tenths = true) => {
  const safe = Math.max(0, milliseconds)
  const minutes = Math.floor(safe / 60000)
  const seconds = Math.floor((safe % 60000) / 1000)
  const tenth = Math.floor((safe % 1000) / 100)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${tenths ? `.${tenth}` : ''}`
}
const formatGoal = (milliseconds) => {
  if (!milliseconds) return 'Off'
  const totalSeconds = Math.round(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`
}

export default function HandstandTimer({ onClose, onSave }) {
  const [timerState, setTimerState] = useState('idle')
  const [startDelay, setStartDelay] = useState(3)
  const [goalMs, setGoalMs] = useState(0)
  const [showCustomGoal, setShowCustomGoal] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(0)
  const [customSeconds, setCustomSeconds] = useState(30)
  const [goalReached, setGoalReached] = useState(false)
  const [goalPulse, setGoalPulse] = useState(false)
  const [countdownValue, setCountdownValue] = useState(3)
  const [countdownProgress, setCountdownProgress] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [rawMs, setRawMs] = useState(0)
  const [finalMs, setFinalMs] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedSetNumber, setSavedSetNumber] = useState(1)
  const [showCustomRest, setShowCustomRest] = useState(false)
  const [restMinutes, setRestMinutes] = useState(2)
  const [restSeconds, setRestSeconds] = useState(30)
  const [restTotalMs, setRestTotalMs] = useState(0)
  const [restRemainingMs, setRestRemainingMs] = useState(0)
  const [wakeWarning, setWakeWarning] = useState(false)
  const [requestingWakeLock, setRequestingWakeLock] = useState(false)
  const frameRef = useRef(0)
  const countdownStartRef = useRef(0)
  const runningStartRef = useRef(0)
  const audioRef = useRef(null)
  const goalNotificationPlayedRef = useRef(false)
  const goalPulseTimeoutRef = useRef(0)
  const restEndRef = useRef(0)
  const wakeLockRef = useRef(null)
  const intentionalWakeReleaseRef = useRef(false)
  const timerStateRef = useRef(timerState)

  useEffect(() => { timerStateRef.current = timerState }, [timerState])

  useEffect(() => {
    document.documentElement.classList.add('handstand-open')
    document.body.classList.add('handstand-open')
    return () => {
      cancelAnimationFrame(frameRef.current)
      clearTimeout(goalPulseTimeoutRef.current)
      releaseWakeLock()
      document.documentElement.classList.remove('handstand-open')
      document.body.classList.remove('handstand-open')
    }
  }, [])

  useEffect(() => {
    if (timerState !== 'rest') return undefined
    const tick = () => {
      const remaining = Math.max(0, restEndRef.current - performance.now())
      setRestRemainingMs(remaining)
      if (remaining <= 0) { playSuccessSound(); setTimerState('ready'); return }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [timerState])

  function unlockAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      audioRef.current ||= new AudioContext()
      audioRef.current.resume()
    } catch { /* Timer remains functional without audio. */ }
  }

  function playSuccessSound() {
    const context = audioRef.current
    if (!context) return
    try {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(660, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + .16)
      gain.gain.setValueAtTime(.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(.16, context.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .2)
      oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .21)
    } catch { /* Audio is optional. */ }
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) { setWakeWarning(true); return false }
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      wakeLockRef.current = sentinel
      intentionalWakeReleaseRef.current = false
      sentinel.addEventListener('release', () => {
        wakeLockRef.current = null
        if (!intentionalWakeReleaseRef.current && (timerStateRef.current === 'countdown' || timerStateRef.current === 'running')) setWakeWarning(true)
        intentionalWakeReleaseRef.current = false
      })
      return true
    } catch { setWakeWarning(true); return false }
  }

  function releaseWakeLock() {
    const sentinel = wakeLockRef.current
    if (!sentinel) return
    intentionalWakeReleaseRef.current = true
    wakeLockRef.current = null
    sentinel.release().catch(() => { intentionalWakeReleaseRef.current = false })
  }

  function prepareAttempt() {
    unlockAudio(); setSaveError(''); setElapsedMs(0); setCountdownValue(startDelay); setCountdownProgress(0); setGoalReached(false); setGoalPulse(false); goalNotificationPlayedRef.current = false
  }

  function beginCountdown() {
    countdownStartRef.current = performance.now(); setTimerState('countdown')
    const tick = (now) => {
      const passed = now - countdownStartRef.current
      const remaining = Math.max(0, startDelay * 1000 - passed)
      setCountdownValue(Math.max(1, Math.ceil(remaining / 1000)))
      setCountdownProgress(Math.min(1, passed / (startDelay * 1000)))
      if (remaining <= 0) { beginRunning(now); return }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  async function start() {
    prepareAttempt(); setRequestingWakeLock(true)
    const locked = await requestWakeLock()
    setRequestingWakeLock(false)
    if (locked) beginCountdown()
  }

  function continueWithoutWakeLock() {
    setWakeWarning(false)
    if (timerStateRef.current === 'idle') beginCountdown()
  }

  function beginRunning(startTimestamp) {
    runningStartRef.current = startTimestamp; setElapsedMs(0); setTimerState('running')
    const tick = (now) => {
      const elapsed = now - runningStartRef.current
      if (goalMs > 0 && elapsed >= goalMs && !goalNotificationPlayedRef.current) {
        goalNotificationPlayedRef.current = true; setGoalReached(true); setGoalPulse(true); playSuccessSound()
        goalPulseTimeoutRef.current = setTimeout(() => setGoalPulse(false), 1800)
      }
      setElapsedMs(elapsed); frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  function stop(event) {
    cancelAnimationFrame(frameRef.current)
    const measured = event.timeStamp - runningStartRef.current
    releaseWakeLock()
    setElapsedMs(measured); setRawMs(measured); setFinalMs(measured); setTimerState('stopped')
  }

  function reset() { cancelAnimationFrame(frameRef.current); clearTimeout(goalPulseTimeoutRef.current); releaseWakeLock(); setWakeWarning(false); setElapsedMs(0); setRawMs(0); setFinalMs(0); setSaveError(''); setGoalReached(false); setGoalPulse(false); goalNotificationPlayedRef.current = false; setTimerState('idle') }

  function startNextSet() {
    setShowCustomRest(false); setRestTotalMs(0); setRestRemainingMs(0); reset()
  }

  function startRest(milliseconds) {
    if (milliseconds < 1000) return
    unlockAudio(); setShowCustomRest(false); setRestTotalMs(milliseconds); setRestRemainingMs(milliseconds); restEndRef.current = performance.now() + milliseconds; setTimerState('rest')
  }

  function addRestTime() {
    restEndRef.current += 30000
    setRestTotalMs((value) => value + 30000)
    setRestRemainingMs((value) => value + 30000)
  }

  function setCustomGoal() {
    const value = (Number(customMinutes) * 60 + Number(customSeconds)) * 1000
    if (value < 1000 || value > 3599000) return
    setGoalMs(value); setShowCustomGoal(false)
  }

  async function saveResult() {
    if (finalMs <= 0) return
    try { setSaving(true); setSaveError(''); const setNumber = await onSave(finalMs); setSavedSetNumber(setNumber); setTimerState('saved') }
    catch (error) { setSaveError(error.message) }
    finally { setSaving(false) }
  }

  const ringProgress = ((elapsedMs / 1000) % 60) / 60

  return <div className={`handstand-timer-shell state-${timerState}${goalPulse ? ' goal-pulse' : ''}`} role="dialog" aria-modal="true" aria-label="Handstand timer">
    <div className="handstand-timer">
      <header><button type="button" aria-label="Close handstand timer" onClick={timerState === 'running' || timerState === 'countdown' ? undefined : onClose}>‹</button><h2>Handstand</h2><span aria-hidden="true"></span></header>
      {timerState === 'idle' && <div className="timer-idle">
        <div className="handstand-visual"><img src={handstandImage} alt="Handstand"/></div>
        <OptionGroup title="Start delay" values={delayOptions} selected={startDelay} onSelect={setStartDelay} format={(value) => `${value}s`}/>
        <GoalSelector goalMs={goalMs} onSelect={setGoalMs} showCustom={showCustomGoal} onShowCustom={() => setShowCustomGoal(true)} customMinutes={customMinutes} customSeconds={customSeconds} onMinutes={setCustomMinutes} onSeconds={setCustomSeconds} onCancel={() => setShowCustomGoal(false)} onConfirm={setCustomGoal}/>
        <button className="timer-primary" type="button" disabled={requestingWakeLock} onClick={start}>▶ <span>{requestingWakeLock ? 'Starting…' : 'Start'}</span></button>
      </div>}
      {timerState === 'countdown' && <div className="timer-stage"><div className="stage-figure"><img src={handstandImage} alt=""/></div><CircularTimer progress={countdownProgress}><span>Get ready</span><strong className="countdown-number" key={countdownValue}>{countdownValue}</strong></CircularTimer><button className="timer-secondary" type="button" onClick={reset}>Cancel</button></div>}
      {timerState === 'running' && <div className="timer-stage"><div className="stage-figure"><img src={handstandImage} alt=""/></div><CircularTimer progress={ringProgress}><strong className="running-time">{formatTime(elapsedMs)}</strong>{goalReached && <span className="goal-reached-indicator">✓ Goal reached</span>}{goalMs > 0 && <span>Goal: {formatGoal(goalMs)}</span>}</CircularTimer><button className="timer-secondary stop" type="button" onClick={stop}>■ <span>Stop</span></button></div>}
      {timerState === 'stopped' && <div className="timer-stopped"><p>Recorded time</p><h3>{formatTime(rawMs)}</h3><TimeRewindDial rawMs={rawMs} finalMs={finalMs} onChange={setFinalMs}/><p>Final time</p><strong className="final-time">{formatTime(finalMs)}</strong>{saveError && <p className="timer-error">{saveError}</p>}<div className="timer-actions"><button type="button" onClick={reset}>Discard</button><button className="timer-primary" type="button" disabled={saving || finalMs <= 0} onClick={saveResult}>✓ {saving ? 'Saving…' : 'Save'}</button></div></div>}
      {timerState === 'saved' && <div className="timer-saved"><div className="saved-check">✓</div><p className="saved-kicker">Set saved</p><h3>HANDSTAND</h3><strong className="saved-duration">{formatTime(finalMs)}</strong><p>Set {savedSetNumber}</p><section className="next-set-panel"><h4>WHAT NEXT?</h4><button className="timer-primary" type="button" onClick={startNextSet}>Start next set</button><p>Rest before next set</p><div className="rest-options"><button type="button" onClick={() => startRest(120000)}>2:00</button><button type="button" onClick={() => startRest(180000)}>3:00</button><button type="button" onClick={() => setShowCustomRest(true)}>Custom</button></div>{showCustomRest && <CustomRest minutes={restMinutes} seconds={restSeconds} onMinutes={setRestMinutes} onSeconds={setRestSeconds} onCancel={() => setShowCustomRest(false)} onStart={() => startRest((Number(restMinutes) * 60 + Number(restSeconds)) * 1000)}/>}<button className="back-to-exercises" type="button" onClick={onClose}>Back to exercises</button></section></div>}
      {timerState === 'rest' && <div className="timer-rest"><p className="rest-label">REST</p><CircularTimer progress={restTotalMs ? restRemainingMs / restTotalMs : 0}><strong className="rest-time">{formatTime(restRemainingMs, false)}</strong><span>Next: Handstand — Set {savedSetNumber + 1}</span></CircularTimer><div className="rest-actions"><button type="button" onClick={() => setTimerState('ready')}>Skip rest</button><button type="button" onClick={addRestTime}>+30 sec</button></div></div>}
      {timerState === 'ready' && <div className="timer-ready"><div className="saved-check">✓</div><p>READY</p><h3>Ready for next set</h3><span>Handstand — Set {savedSetNumber + 1}</span><button className="timer-primary" type="button" onClick={startNextSet}>Start next set</button></div>}
      {wakeWarning && <div className="wake-warning-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="wake-warning-title" aria-describedby="wake-warning-message"><section className="wake-warning"><div className="wake-warning-icon">☾</div><h3 id="wake-warning-title">Screen may turn off</h3><p id="wake-warning-message">Your phone may be using Low Power Mode or other system settings that prevent the app from keeping the screen awake. The timer will continue, but your screen may dim or lock.</p><div><button type="button" onClick={reset}>Cancel</button><button className="timer-primary" type="button" onClick={continueWithoutWakeLock}>Continue</button></div></section></div>}
    </div>
  </div>
}

function OptionGroup({ title, values, selected, onSelect, format }) {
  return <fieldset className="timer-options"><legend>{title}</legend><div>{values.map((value) => <button type="button" aria-pressed={selected === value} className={selected === value ? 'selected' : ''} key={value} onClick={() => onSelect(value)}>{format(value)}</button>)}</div></fieldset>
}

function GoalSelector({ goalMs, onSelect, showCustom, onShowCustom, customMinutes, customSeconds, onMinutes, onSeconds, onCancel, onConfirm }) {
  const isCustom = goalMs > 0 && !goalOptions.includes(goalMs)
  const totalCustomSeconds = Number(customMinutes) * 60 + Number(customSeconds)
  return <fieldset className="timer-options goal-options"><legend>Goal time</legend><div className="goal-preset-grid">{goalOptions.map((value) => <button type="button" aria-pressed={goalMs === value} className={goalMs === value ? 'selected' : ''} key={value} onClick={() => { onSelect(value); onCancel() }}>{value === 0 ? 'Off' : `${value / 1000}s`}</button>)}</div><button type="button" aria-pressed={isCustom} className={isCustom ? 'selected custom-goal-button' : 'custom-goal-button'} onClick={onShowCustom}>{isCustom ? `Custom goal: ${formatGoal(goalMs)}` : 'Custom goal'}</button>{showCustom && <div className="custom-goal-panel"><p>Custom goal</p><div className="custom-time-fields"><label>MIN<select aria-label="Custom goal minutes" value={customMinutes} onChange={(event) => onMinutes(event.target.value)}>{Array.from({length:60},(_,value)=><option key={value} value={value}>{String(value).padStart(2,'0')}</option>)}</select></label><b>:</b><label>SEC<select aria-label="Custom goal seconds" value={customSeconds} onChange={(event) => onSeconds(event.target.value)}>{Array.from({length:60},(_,value)=><option key={value} value={value}>{String(value).padStart(2,'0')}</option>)}</select></label></div><div className="custom-goal-actions"><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="selected" disabled={totalCustomSeconds < 1} onClick={onConfirm}>Set goal</button></div></div>}</fieldset>
}

function CustomRest({ minutes, seconds, onMinutes, onSeconds, onCancel, onStart }) {
  const totalSeconds = Number(minutes) * 60 + Number(seconds)
  return <div className="custom-rest-panel"><p>REST TIME</p><div className="custom-time-fields"><label>MIN<select aria-label="Custom rest minutes" value={minutes} onChange={(event) => onMinutes(event.target.value)}>{Array.from({length:60},(_,value)=><option key={value} value={value}>{String(value).padStart(2,'0')}</option>)}</select></label><b>:</b><label>SEC<select aria-label="Custom rest seconds" value={seconds} onChange={(event) => onSeconds(event.target.value)}>{Array.from({length:60},(_,value)=><option key={value} value={value}>{String(value).padStart(2,'0')}</option>)}</select></label></div><div className="custom-goal-actions"><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="selected" disabled={totalSeconds < 1} onClick={onStart}>Start rest</button></div></div>
}
