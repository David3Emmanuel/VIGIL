import { useState, useCallback } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

const RISK_STYLES = {
  LOW:    'bg-tertiary/20 border border-tertiary text-tertiary',
  MEDIUM: 'bg-on-secondary-container/20 border border-on-secondary-container text-on-secondary-container',
  HIGH:   'bg-error/20 border border-error text-error',
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(); osc.stop(ctx.currentTime + 0.3)
  } catch (_) {}
}

export function ResidentPanel({ onGateDecision }) {
  const [notifications, setNotifications] = useState([])
  const [accessLog, setAccessLog] = useState([])

  const handleMessage = useCallback((data) => {
    if (data.type !== 'visitor_notification') return
    playBeep()
    setNotifications((prev) => [{ ...data, id: Date.now(), decided: false }, ...prev])
  }, [])

  useWebSocket('/ws', handleMessage)

  const decide = (id, approved) => {
    const notif = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, decided: true, approved } : n))
    const ts = new Date().toLocaleTimeString('en-NG', { hour12: false })
    setAccessLog((prev) => [{
      id: Date.now(),
      time: ts,
      color: approved ? 'text-tertiary' : 'text-error',
      text: `[${approved ? 'AUTH' : 'DENY'}] ${notif?.summary || 'Visitor'}`
    }, ...prev])
    onGateDecision?.(approved ? 'OPEN' : 'DENIED')
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Panel header */}
      <div className="bg-surface-container p-4 flex justify-between items-center hud-shadow border-l-2 border-tertiary">
        <div className="flex items-center space-x-2 text-on-surface">
          <span className="material-symbols-outlined text-tertiary">notifications</span>
          <h2 className="font-headline font-bold text-sm tracking-[0.1em] uppercase">Resident Notifications</h2>
        </div>
        <div className="w-2 h-2 bg-tertiary shadow-[0_0_8px_rgba(106,247,186,0.8)] animate-pulse" />
      </div>

      {/* Notification cards */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-96">
        {notifications.length === 0 && (
          <div className="text-on-surface-variant text-xs tracking-widest text-center py-8 uppercase">
            Awaiting visitor at gate...
          </div>
        )}
        {notifications.map((n) => (
          <div key={n.id} className="bg-surface-container-lowest ghost-border flex flex-col">
            {n.image && (
              <div className="h-32 overflow-hidden relative">
                <img src={n.image} alt="Visitor" className="w-full h-full object-cover grayscale" />
                <div className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] tracking-widest font-bold ${RISK_STYLES[n.risk_level] ?? RISK_STYLES.MEDIUM}`}>
                  {n.risk_level} RISK
                </div>
              </div>
            )}
            <div className="p-4 flex flex-col space-y-3">
              <div>
                <h3 className="text-on-surface text-sm font-bold tracking-wider uppercase">
                  {n.demeanor === 'suspicious' ? '⚠ ' : ''}{n.summary}
                </h3>
                <p className="text-on-surface-variant text-xs mt-1">{n.description}</p>
                {n.items_carried && n.items_carried.toLowerCase() !== 'none' && (
                  <p className="text-on-surface-variant text-xs mt-0.5">Carrying: {n.items_carried}</p>
                )}
              </div>
              {!n.decided ? (
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => decide(n.id, true)}
                    className="flex-1 py-2 border border-tertiary text-tertiary hover:bg-tertiary/10 transition-colors text-xs tracking-widest font-bold"
                  >APPROVE</button>
                  <button
                    onClick={() => decide(n.id, false)}
                    className="flex-1 py-2 border border-error text-error hover:bg-error/10 transition-colors text-xs tracking-widest font-bold"
                  >DENY</button>
                </div>
              ) : (
                <div className={`text-center py-2 text-xs font-bold tracking-widest border ${n.approved ? 'border-tertiary text-tertiary' : 'border-error text-error'}`}>
                  {n.approved ? '✓ APPROVED' : '✗ DENIED'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Access log */}
      <div className="bg-surface-container p-4 flex flex-col space-y-2 max-h-48">
        <h3 className="text-primary text-xs tracking-widest uppercase border-b border-outline-variant/30 pb-2 mb-2">
          Access Log
        </h3>
        <div className="overflow-y-auto text-[10px] font-body text-on-surface-variant space-y-1">
          {accessLog.length === 0 && (
            <span className="text-on-surface-variant/50">No entries yet</span>
          )}
          {accessLog.map((entry) => (
            <div key={entry.id} className="flex">
              <span className={`w-20 ${entry.color}`}>{entry.time}</span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
