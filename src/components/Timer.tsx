import { useEffect, useRef, useState } from 'react'
import { IconPause, IconPlay, IconRefresh } from './Icons'

export function Timer({
  seconds,
  running,
  onToggle,
  onReset,
  onExpire,
  resetKey,
}: {
  /** thời lượng dự kiến cho câu này */
  seconds: number
  running: boolean
  onToggle: () => void
  onReset: () => void
  onExpire?: () => void
  /** đổi giá trị này để reset đồng hồ (thường là question id) */
  resetKey: string
}) {
  const [elapsed, setElapsed] = useState(0)
  const expiredRef = useRef(false)

  useEffect(() => {
    setElapsed(0)
    expiredRef.current = false
  }, [resetKey])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    if (elapsed >= seconds && !expiredRef.current) {
      expiredRef.current = true
      onExpire?.()
    }
  }, [elapsed, seconds, onExpire])

  const remaining = seconds - elapsed
  const over = remaining < 0
  const pct = Math.min(1, elapsed / seconds)
  const mm = Math.floor(Math.abs(remaining) / 60)
  const ss = Math.abs(remaining) % 60

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-1.5 w-full min-w-[80px] flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${
            over ? 'bg-rose-500' : pct > 0.75 ? 'bg-amber-500' : 'bg-accent-500'
          }`}
          style={{ width: `${over ? 100 : pct * 100}%` }}
        />
      </div>
      <span
        className={`shrink-0 font-mono text-sm tabular-nums ${
          over ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-ink-600 dark:text-ink-300'
        }`}
        aria-live="off"
      >
        {over ? '+' : ''}
        {mm}:{String(ss).padStart(2, '0')}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="btn shrink-0 px-2"
        aria-label={running ? 'Tạm dừng' : 'Tiếp tục'}
      >
        {running ? <IconPause /> : <IconPlay />}
      </button>
      <button type="button" onClick={onReset} className="btn shrink-0 px-2" aria-label="Đặt lại đồng hồ">
        <IconRefresh />
      </button>
    </div>
  )
}
