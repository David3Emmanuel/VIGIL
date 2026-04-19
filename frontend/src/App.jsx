import { useState, useEffect } from 'react'
import { GatePanel } from './components/GatePanel'
import { ResidentPanel } from './components/ResidentPanel'
import { ThreatPanel } from './components/ThreatPanel'
import { AlertCascade } from './components/AlertCascade'
import './index.css'

export default function App() {
  const [detectedThreat, setDetectedThreat] = useState(null)
  const [cascadeTrigger, setCascadeTrigger] = useState(0)
  const [gateStatus, setGateStatus] = useState('STANDBY')
  const [toast, setToast] = useState(null)

  const showToast = (label) => {
    setToast(label)
    setTimeout(() => setToast(null), 2500)
  }

  const handleThreatDetected = (threat) => {
    setDetectedThreat(threat)
    setTimeout(() => setCascadeTrigger((n) => n + 1), 500)
  }

  return (
    <div className="bg-surface-dim text-on-surface h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-6 h-16 bg-[#0e1322] border-b border-[#3c494e]/15 z-50 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-[#00d4ff] font-black tracking-tighter text-2xl uppercase italic">VIGIL</h1>
          <span className="text-on-surface-variant text-xs tracking-[0.1em] uppercase hidden md:inline-block">
            Visual Intelligence for Gated Infrastructure &amp; Landmark Security
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center text-primary space-x-2">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="font-label text-sm uppercase tracking-[0.1em]">Lekki Phase 1, Lagos, Nigeria</span>
          </div>
          <div className="flex items-center text-primary space-x-2">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <LiveClock />
          </div>
          <div className="flex space-x-4">
            <button className="text-[#3c494e] hover:bg-[#2f3445] hover:text-[#a8e8ff] transition-colors duration-150 p-2 cursor-pointer">
              <span className="material-symbols-outlined">sensors</span>
            </button>
            <button className="text-[#3c494e] hover:bg-[#2f3445] hover:text-[#a8e8ff] transition-colors duration-150 p-2 cursor-pointer">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col z-40 bg-[#1a1f2f] w-16 xl:w-64 border-r border-[#3c494e]/15 flex-shrink-0">
          <div className="p-4 border-b border-[#3c494e]/15 xl:flex flex-col items-start hidden">
            <span className="text-[#00d4ff] text-[10px] tracking-[0.1em] font-bold">OP_CENTER</span>
            <span className="text-on-surface-variant text-[10px] tracking-[0.1em]">SECTOR_07</span>
          </div>
          <div className="flex-1 flex flex-col pt-4">
            <a className="flex items-center space-x-4 p-4 bg-[#2f3445] text-[#00d4ff] border-l-4 border-[#00d4ff] font-bold group" href="#">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
              <span className="uppercase tracking-[0.1em] text-[10px] hidden xl:inline-block">OVERWATCH</span>
            </a>
            {[
              { icon: 'terminal', label: 'THREAT_LOGS' },
              { icon: 'memory', label: 'SYSTEM_DIAG' },
              { icon: 'hub', label: 'NETWORK_MAP' },
              { icon: 'inventory_2', label: 'ARCHIVE' },
            ].map(({ icon, label }) => (
              <a key={label} onClick={(e) => { e.preventDefault(); showToast(label) }} className="flex items-center space-x-4 p-4 text-[#a8e8ff]/60 hover:text-[#a8e8ff] hover:bg-[#1a1f2f] transition-all duration-200 group cursor-pointer" href="#">
                <span className="material-symbols-outlined">{icon}</span>
                <span className="uppercase tracking-[0.1em] text-[10px] hidden xl:inline-block">{label}</span>
              </a>
            ))}
          </div>
          <div className="p-4 mt-auto">
            <button onClick={() => showToast('INITIATE_SCAN')} className="w-full text-center py-2 px-2 border border-primary/20 text-primary uppercase text-[10px] tracking-[0.1em] hover:bg-surface-variant transition-colors flex items-center justify-center space-x-2">
              <span className="material-symbols-outlined text-sm">radar</span>
              <span className="hidden xl:inline-block">INITIATE_SCAN</span>
            </button>
          </div>
        </nav>

        {/* Main grid */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto bg-surface-dim">
          <GatePanel gateStatus={gateStatus} onGateStatusChange={setGateStatus} />
          <ResidentPanel onGateDecision={setGateStatus} />
          <div className="flex flex-col space-y-6">
            <ThreatPanel onThreatDetected={handleThreatDetected} />
            <AlertCascade incident={detectedThreat} triggerCount={cascadeTrigger} />
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest border border-outline-variant/40 text-on-surface-variant text-xs tracking-widest uppercase px-5 py-3 hud-shadow">
          {toast} — to be implemented
        </div>
      )}
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-NG', { hour12: false }))
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString('en-NG', { hour12: false })),
      1000
    )
    return () => clearInterval(id)
  }, [])
  return <span className="font-label text-sm uppercase tracking-[0.1em] font-bold">{time} WAT</span>
}
