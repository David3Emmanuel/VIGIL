import { useState, useEffect, useCallback } from 'react'
import { useAlertStream } from '../hooks/useAlertStream'

const TIER_LABEL_COLORS = ['text-amber', 'text-error', 'text-secondary']
const TIER_BORDER_COLORS = ['border-amber', 'border-error', 'border-secondary-container']
const TIER_BG_COLORS     = ['bg-surface-container-low', 'bg-surface-container-low', 'bg-surface-container-lowest']

export function AlertCascade({ incident, triggerCount }) {
  const [tiers, setTiers] = useState([])
  const [running, setRunning] = useState(false)
  const { startCascade } = useAlertStream()

  const handleTier = useCallback((data) => {
    setTiers((prev) => [...prev, data])
  }, [])

  useEffect(() => {
    if (!incident || triggerCount === 0) return
    setTiers([])
    setRunning(true)
    startCascade(incident, handleTier).finally(() => setRunning(false))
  }, [triggerCount])

  return (
    <div className="bg-surface-container p-4 flex flex-col space-y-4">
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
        <h2 className="font-headline font-bold text-sm tracking-[0.1em] text-on-surface uppercase">
          Alert Cascade
        </h2>
        {running && (
          <span className="text-amber text-[10px] tracking-widest uppercase animate-pulse">
            Broadcasting...
          </span>
        )}
      </div>

      {!incident && tiers.length === 0 && (
        <p className="text-on-surface-variant text-xs tracking-widest text-center py-4 uppercase">
          Analyse a threat scene to trigger cascade
        </p>
      )}

      <div className="space-y-3">
        {tiers.map((tier, i) => (
          <div
            key={tier.tier}
            className={`${TIER_BG_COLORS[i] ?? 'bg-surface-container-low'} border-l-2 ${TIER_BORDER_COLORS[i] ?? 'border-primary'} p-3 flex flex-col space-y-2 tier-enter`}
          >
            {/* Tier header */}
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold tracking-widest ${TIER_LABEL_COLORS[i] ?? 'text-primary'}`}>
                TIER {tier.tier} // {tier.label}
              </span>
              <span className="text-on-surface-variant text-[10px]">{tier.timestamp}</span>
            </div>

            {/* Classification */}
            <span className="text-on-surface text-xs font-bold tracking-wide">
              {tier.classification?.replace(/_/g, ' ')}
            </span>

            {/* Description */}
            <span className="text-on-surface text-xs">{tier.description}</span>

            {/* Recipients */}
            <div className="flex flex-wrap gap-1 pt-1">
              {tier.recipients?.map((r) => (
                <span key={r} className="border border-outline-variant/40 text-on-surface-variant text-[10px] px-2 py-0.5">
                  {r}
                </span>
              ))}
            </div>

            {/* Confidence bar */}
            <div className="w-full bg-surface-dim h-0.5 mt-1">
              <div
                className={`h-0.5 transition-all duration-700 ${TIER_BORDER_COLORS[i]?.replace('border-', 'bg-') ?? 'bg-primary'}`}
                style={{ width: `${tier.confidence}%` }}
              />
            </div>

            {/* Emergency message (Tier 3) */}
            {tier.emergency_message && (
              <div className="mt-2 bg-secondary-container/10 border border-secondary-container/30 p-2 text-secondary text-[10px] font-body">
                <span className="opacity-50">[SYS_MSG] </span>
                <pre className="whitespace-pre-wrap font-body text-[10px] leading-relaxed mt-1">
                  {tier.emergency_message}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
