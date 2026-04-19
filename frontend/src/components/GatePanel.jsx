import { useRef, useEffect, useState } from 'react'

const STATUS_STYLES = {
  STANDBY:  { label: 'STANDBY',      cls: 'border-outline text-on-surface-variant' },
  OPEN:     { label: 'GATE OPEN',    cls: 'border-tertiary text-tertiary' },
  DENIED:   { label: 'ACCESS DENIED', cls: 'border-error text-error' },
}

export function GatePanel({ gateStatus, onGateStatusChange }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream })
      .catch(() => setDemoMode(true))
  }, [])

  const postCapture = async (blob) => {
    setCapturing(true)
    const formData = new FormData()
    formData.append('image', blob, 'visitor.jpg')
    try {
      await fetch('/api/visitor/capture', { method: 'POST', body: formData })
    } catch (err) {
      console.error('Capture error:', err)
    } finally {
      setCapturing(false)
    }
  }

  const handleCapture = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => postCapture(blob), 'image/jpeg', 0.85)
  }

  const handleDemoCapture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 640; canvas.height = 480
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0e1322'; ctx.fillRect(0, 0, 640, 480)
    ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 28px Space Grotesk'
    ctx.fillText('DEMO VISITOR', 195, 245)
    canvas.toBlob((blob) => postCapture(blob), 'image/jpeg', 0.85)
  }

  const status = STATUS_STYLES[gateStatus] ?? STATUS_STYLES.STANDBY

  return (
    <div className="flex flex-col space-y-6">
      {/* Panel header */}
      <div className="bg-surface-container border-l-2 border-error p-4 flex justify-between items-center hud-shadow">
        <div className="flex items-center space-x-2 text-on-surface">
          <span className="material-symbols-outlined text-error">videocam</span>
          <h2 className="font-headline font-bold text-sm tracking-[0.1em] uppercase">Gate Camera</h2>
        </div>
        <div className="flex items-center space-x-2 text-error animate-pulse">
          <span className="text-xs font-bold tracking-widest">REC</span>
          <div className="w-2 h-2 bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]"></div>
        </div>
      </div>

      {/* Camera feed */}
      <div className="relative aspect-video bg-black ghost-border overflow-hidden">
        {demoMode ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#090e1c]">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-2">videocam_off</span>
            <span className="text-on-surface-variant text-xs tracking-widest uppercase">Camera Offline — Demo Mode</span>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80 grayscale contrast-125" />
        )}
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 scanlines pointer-events-none" />
        {/* HUD corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary m-2" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary m-2" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary m-2" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary m-2" />
        <div className="absolute top-4 left-4 flex flex-col space-y-1">
          <span className="text-primary text-[10px] tracking-widest bg-black/60 px-2 py-1">[CAM-01-NORTH]</span>
          <span className="text-tertiary text-[10px] tracking-widest bg-black/60 px-2 py-1">SYS: ONLINE</span>
        </div>
        <div className="absolute bottom-4 right-4 text-primary text-[10px] tracking-widest bg-black/60 px-2 py-1">
          FPS: 29.97 | VIGIL SECURE
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface-container-low p-4 flex flex-col space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-outline-variant/30">
          <span className="text-on-surface-variant text-xs tracking-widest">PHYSICAL STATUS</span>
          <div className={`border px-3 py-1 text-xs font-bold tracking-widest ${status.cls}`}>
            {status.label}
          </div>
        </div>
        <button
          onClick={demoMode ? handleDemoCapture : handleCapture}
          disabled={capturing}
          className="w-full py-3 border border-primary text-primary hover:bg-surface-variant transition-colors flex items-center justify-center space-x-2 text-sm tracking-widest uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">photo_camera</span>
          <span>{capturing ? 'SCANNING...' : 'CAPTURE VISITOR'}</span>
        </button>
      </div>
    </div>
  )
}
