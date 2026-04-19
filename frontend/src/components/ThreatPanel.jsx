import { useState } from 'react'

const SCENARIOS = [
  { id: 1, label: 'SCENE_CAM_03 — Perimeter Fence' },
  { id: 2, label: 'SCENE_CAM_01 — Main Entrance' },
  { id: 3, label: 'SCENE_CAM_07 — East Wing Ground' },
]

const CLASS_STYLES = {
  CLEAR:               { badge: 'bg-tertiary text-on-tertiary', bar: 'bg-tertiary', border: 'border-tertiary', icon: 'check_circle', action: 'text-tertiary' },
  SUSPICIOUS_ACTIVITY: { badge: 'bg-amber text-on-error',       bar: 'bg-amber',    border: 'border-amber',    icon: 'warning',      action: 'text-amber'   },
  SECURITY_THREAT:     { badge: 'bg-error text-on-error',       bar: 'bg-error',    border: 'border-error',    icon: 'gpp_bad',      action: 'text-amber'   },
  MEDICAL_EMERGENCY:   { badge: 'bg-amber text-on-error',       bar: 'bg-amber',    border: 'border-amber',    icon: 'emergency',    action: 'text-amber'   },
}

export function ThreatPanel({ onThreatDetected }) {
  const [selectedId, setSelectedId] = useState(1)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const analyze = async () => {
    setAnalyzing(true)
    setResult(null)
    try {
      const res = await fetch('/api/threat/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: selectedId }),
      })
      const data = await res.json()
      setResult(data)
      onThreatDetected?.(data)
    } catch (err) {
      console.error('Threat analysis error:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  const style = result ? (CLASS_STYLES[result.classification] ?? CLASS_STYLES.SUSPICIOUS_ACTIVITY) : null

  return (
    <div className="bg-surface-container-high hud-shadow border-l-2 border-amber p-1 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-surface-dim flex justify-between items-center">
        <div className="flex items-center space-x-2 text-on-surface">
          <span className="material-symbols-outlined text-amber">warning</span>
          <h2 className="font-headline font-bold text-sm tracking-[0.1em] uppercase">Threat Detection</h2>
        </div>
      </div>

      <div className="p-3 flex flex-col space-y-4">
        {/* Scene preview */}
        <div className="relative aspect-video bg-black overflow-hidden">
          <img
            src={`/static/scenarios/scenario_${selectedId}.jpg`}
            alt="Scenario"
            className="w-full h-full object-cover brightness-75 contrast-125 grayscale"
          />
          <div className="absolute inset-0 border border-error/50" />
          {result && (
            <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border border-amber bg-amber/10 flex flex-col justify-end p-1">
              <span className="text-amber text-[8px] bg-black/60 inline-block px-1 w-fit">
                {result.classification} ({result.confidence}%)
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex space-x-2">
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(Number(e.target.value)); setResult(null) }}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface text-xs focus:ring-0 focus:border-primary focus:bg-surface-bright flex-1 p-2"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={analyze}
            disabled={analyzing}
            className="bg-primary-container text-on-primary font-bold text-xs px-4 uppercase tracking-widest hover:bg-primary-fixed transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? 'SCANNING...' : 'ANALYZE'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`bg-surface-container-lowest p-3 border-l-2 ${style.border} space-y-3`}>
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${style.badge}`}>
                {result.classification.replace(/_/g, ' ')}
              </span>
              <span className="text-on-surface-variant text-xs">CONFIDENCE: {result.confidence}%</span>
            </div>
            <div className="w-full bg-surface-dim h-1">
              <div
                className={`h-1 shadow-[0_0_8px_rgba(255,180,171,0.5)] transition-all duration-700 ${style.bar}`}
                style={{ width: `${result.confidence}%` }}
              />
            </div>
            <p className="text-on-surface-variant text-xs leading-relaxed">{result.description}</p>
            <div className={`text-xs font-bold tracking-wide flex items-center space-x-1 ${style.action}`}>
              <span className="material-symbols-outlined text-sm">front_hand</span>
              <span>ACTION REQ: {result.recommended_action}</span>
            </div>
            {result.location_in_frame && (
              <p className="text-on-surface-variant text-[10px] tracking-widest">
                📍 {result.location_in_frame}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
