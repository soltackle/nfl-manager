/* ------------------------------------------------------------------ */
/*  CinematicStage — broadcast kamera, 22 oyuncu, top, efekt katmanı.  */
/* ------------------------------------------------------------------ */
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain } from 'lucide-react'
import { buildScene, sceneTotal, uPct, vPct, type PlayLog, type Phase, type Scene } from './playbook'

const HOME_COLOR = '#00a2ff'
const AWAY_COLOR = '#ff9c00'

/* ============================== SES ============================== */
const TD_MP3 = typeof Audio !== 'undefined' ? new Audio('/sounds/Touchdown.mp3') : null
let audioCtx: AudioContext | null = null
const ac = (): AudioContext | null => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch { return null }
}
function crowd(vol: number, dur: number, freq: number) {
  const c = ac(); if (!c) return
  try {
    const len = Math.floor(c.sampleRate * dur)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    const src = c.createBufferSource(); src.buffer = buf
    const filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = freq; filt.Q.value = 0.6
    const g = c.createGain()
    const t = c.currentTime
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filt); filt.connect(g); g.connect(c.destination)
    src.start(t); src.stop(t + dur)
  } catch { /* noop */ }
}
function whistle() {
  const c = ac(); if (!c) return
  try {
    const t = c.currentTime
    for (let i = 0; i < 2; i++) {
      const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 2650
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, t + i * 0.28)
      g.gain.exponentialRampToValueAtTime(0.05, t + i * 0.28 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.28 + 0.2)
      o.connect(g); g.connect(c.destination)
      o.start(t + i * 0.28); o.stop(t + i * 0.28 + 0.22)
    }
  } catch { /* noop */ }
}
function thump() {
  const c = ac(); if (!c) return
  try {
    const t = c.currentTime
    const o = c.createOscillator(); o.type = 'sine'
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25)
    const g = c.createGain()
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.32)
  } catch { /* noop */ }
}
function playSfx(kind: Scene['sfx'], muted: boolean) {
  if (muted || !kind) return
  if (kind === 'td') {
    try { if (TD_MP3) { TD_MP3.currentTime = 0; TD_MP3.volume = 0.9; void TD_MP3.play().catch(() => {}) } } catch { /* noop */ }
    crowd(0.16, 2.4, 500)
  } else if (kind === 'roar') crowd(0.1, 1.5, 550)
  else if (kind === 'groan') crowd(0.09, 1.3, 240)
  else if (kind === 'whistle') whistle()
  else if (kind === 'kick') { thump(); crowd(0.09, 1.4, 520) }
}

/* ============================== SAHA ============================== */
const FieldSVG = memo(function FieldSVG({ homeName, awayName }: { homeName: string; awayName: string }) {
  const hn = homeName.slice(0, 14).toUpperCase()
  const an = awayName.slice(0, 14).toUpperCase()
  return (
    <svg viewBox="0 0 1200 533" className="w-full block select-none" aria-hidden>
      <defs>
        <linearGradient id="turfL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id="spot" cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ezH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#001c3d" /><stop offset="1" stopColor="#003a75" />
        </linearGradient>
        <linearGradient id="ezA" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#4a2400" /><stop offset="1" stopColor="#8a4a00" />
        </linearGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope="0.05" /></feComponentTransfer>
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* çim şeritleri */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={100 + i * 100} y="0" width="100" height="533" fill={i % 2 ? '#0f7a3d' : '#118a45'} />
      ))}
      {/* biçim deseni (diagonal mow) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <rect key={'m' + i} x={100 + i * 200} y="0" width="100" height="533" fill="#ffffff" opacity="0.02" />
      ))}

      {/* endzone'lar */}
      <rect x="0" y="0" width="100" height="533" fill="url(#ezH)" />
      <rect x="1100" y="0" width="100" height="533" fill="url(#ezA)" />
      <text x="52" y="266" fill="#7cc4ff" fontSize="44" fontFamily="Oswald, sans-serif" fontWeight="700" textAnchor="middle" transform="rotate(-90 52 266)" opacity="0.85" letterSpacing="8">{hn}</text>
      <text x="1148" y="266" fill="#ffce8a" fontSize="44" fontFamily="Oswald, sans-serif" fontWeight="700" textAnchor="middle" transform="rotate(90 1148 266)" opacity="0.85" letterSpacing="8">{an}</text>

      {/* pylon'lar */}
      {[100, 1100].map(x => [4, 529].map(y => (
        <rect key={x + '-' + y} x={x - 4} y={y - 4} width="8" height="8" rx="2" fill="#ff6a00" />
      )))}

      {/* kenar çizgileri */}
      <rect x="100" y="6" width="1000" height="521" fill="none" stroke="#ffffff" strokeWidth="5" opacity="0.9" />

      {/* yarda çizgileri */}
      {Array.from({ length: 21 }).map((_, i) => {
        const x = 100 + i * 50
        const major = i % 2 === 0
        return <line key={i} x1={x} y1="6" x2={x} y2="527" stroke="#ffffff" strokeWidth={major ? 3 : 1.4} opacity={major ? 0.8 : 0.4} />
      })}
      {/* hash işaretleri */}
      {Array.from({ length: 99 }).map((_, i) => {
        const x = 110 + i * 10
        return <g key={i} stroke="#ffffff" strokeWidth="1.4" opacity="0.45">
          <line x1={x} y1="172" x2={x} y2="186" />
          <line x1={x} y1="347" x2={x} y2="361" />
        </g>
      })}
      {/* yarda numaraları */}
      {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((n, i) => {
        const x = 200 + i * 100
        return <g key={i} fill="#ffffff" opacity="0.65" fontWeight="800" fontSize="38" fontFamily="Oswald, sans-serif">
          <text x={x} y="84" textAnchor="middle" transform={`rotate(180 ${x} 72)`}>{n}</text>
          <text x={x} y="498" textAnchor="middle">{n}</text>
        </g>
      })}

      {/* orta saha logosu */}
      <circle cx="600" cy="266" r="62" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.35" />
      <text x="600" y="286" textAnchor="middle" fill="#ffffff" fontSize="56" fontFamily="Oswald, sans-serif" fontWeight="700" opacity="0.3" letterSpacing="4">AFL</text>

      {/* kale direkleri (üstten stilize) */}
      {[{ x: 12, c: '#ffe45c' }, { x: 1188, c: '#ffe45c' }].map((p, i) => (
        <g key={i}>
          <line x1={p.x} y1="216" x2={p.x} y2="316" stroke={p.c} strokeWidth="7" strokeLinecap="round" />
          <circle cx={p.x} cy="216" r="6" fill={p.c} />
          <circle cx={p.x} cy="316" r="6" fill={p.c} />
          <circle cx={p.x} cy="266" r="4" fill={p.c} opacity="0.8" />
        </g>
      ))}

      {/* ışık + doku */}
      <rect x="0" y="0" width="1200" height="533" fill="url(#spot)" />
      <rect x="0" y="0" width="1200" height="533" fill="url(#turfL)" />
    </svg>
  )
})

/* ============================== KONFETİ / HAVAİ FİŞEK ============================== */
interface Particle { x: number; y: number; vx: number; vy: number; w: number; h: number; c: string; rot: number; vr: number; life: number; max: number; shape: 'rect' | 'dot' }
function FxCanvas({ burst }: { burst: { id: number; kind: 'td' | 'fg' } | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const parts = useRef<Particle[]>([])
  const raf = useRef(0)

  useEffect(() => {
    if (!burst) return
    const cv = ref.current; if (!cv) return
    const rect = cv.parentElement!.getBoundingClientRect()
    cv.width = rect.width; cv.height = rect.height
    const W = cv.width, H = cv.height
    const colors = ['#ffd000', '#ff9c00', '#00a2ff', '#ffffff', '#4ade80', '#ff5ea8']
    const n = burst.kind === 'td' ? 160 : 60
    for (let i = 0; i < n; i++) {
      parts.current.push({
        x: Math.random() * W, y: -10 - Math.random() * H * 0.3,
        vx: (Math.random() - 0.5) * 1.6, vy: 1.5 + Math.random() * 2.5,
        w: 4 + Math.random() * 5, h: 6 + Math.random() * 7,
        c: colors[i % colors.length], rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        life: 0, max: 140 + Math.random() * 80, shape: 'rect',
      })
    }
    if (burst.kind === 'td') {
      for (let f = 0; f < 3; f++) {
        const cx2 = W * (0.25 + Math.random() * 0.5), cy2 = H * (0.2 + Math.random() * 0.3)
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2, sp = 2 + Math.random() * 3.5
          parts.current.push({
            x: cx2, y: cy2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            w: 2.5, h: 2.5, c: ['#ffd000', '#ffffff', '#ff9c00'][f], rot: 0, vr: 0,
            life: 0, max: 50 + Math.random() * 30, shape: 'dot',
          })
        }
      }
    }
    const ctx = cv.getContext('2d'); if (!ctx) return
    cancelAnimationFrame(raf.current)
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      parts.current = parts.current.filter(p => p.life < p.max && p.y < cv.height + 20)
      for (const p of parts.current) {
        p.life++
        p.vy += p.shape === 'dot' ? 0.06 : 0.03
        p.vx += Math.sin((p.life + p.y) * 0.08) * 0.02
        p.x += p.vx; p.y += p.vy; p.rot += p.vr
        const alpha = Math.max(0, 1 - p.life / p.max)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.c
        if (p.shape === 'dot') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.w, 0, Math.PI * 2); ctx.fill()
        } else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore()
        }
      }
      ctx.globalAlpha = 1
      if (parts.current.length > 0) raf.current = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, cv.width, cv.height)
    }
    raf.current = requestAnimationFrame(tick)
  }, [burst])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  return <canvas ref={ref} className="absolute inset-0 z-30 pointer-events-none" />
}

/* ============================== OYUNCU ============================== */
function PlayerDot({ s, color, phase, speed }: { s: Scene['sprites'][number]; color: string; phase: Phase; speed: number }) {
  const run = phase !== 'pre'
  return (
    <motion.div
      className="absolute z-10 -ml-[7px] -mt-[7px] pointer-events-none"
      initial={{ left: `${uPct(s.from.u)}%`, top: `${vPct(s.from.v)}%`, opacity: 0, scale: 0.4 }}
      animate={{
        left: `${uPct(run ? s.to.u : s.from.u)}%`,
        top: `${vPct(run ? s.to.v : s.from.v)}%`,
        opacity: 1,
        scale: 1,
      }}
      transition={run
        ? { left: { duration: s.dur / speed, delay: s.delay / speed, ease: 'easeInOut' }, top: { duration: s.dur / speed, delay: s.delay / speed, ease: 'easeInOut' }, opacity: { duration: 0.2 }, scale: { duration: 0.2 } }
        : { duration: 0.3, delay: s.delay * 0.5, ease: 'backOut' }}
    >
      <div
        className="w-[14px] h-[14px] rounded-full flex items-center justify-center text-[6px] font-black text-black/60"
        style={{
          background: `radial-gradient(circle at 35% 30%, #ffffff66, transparent 40%), ${color}`,
          boxShadow: `0 2px 4px rgba(0,0,0,0.55), 0 0 8px ${color}55`,
          border: '1px solid rgba(255,255,255,0.55)',
        }}
      >
        {s.label[0]}
      </div>
    </motion.div>
  )
}

/* ============================== TOP ============================== */
const BallSvg = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 26 18">
    <defs>
      <radialGradient id="ballG" cx="0.35" cy="0.3" r="1">
        <stop offset="0" stopColor="#b06a30" /><stop offset="1" stopColor="#6e3a15" />
      </radialGradient>
    </defs>
    <ellipse cx="13" cy="9" rx="12" ry="7.5" fill="url(#ballG)" stroke="#4a260c" strokeWidth="1.4" />
    <line x1="13" y1="3.5" x2="13" y2="14.5" stroke="#fff" strokeWidth="1.4" />
    <line x1="10" y1="9" x2="16" y2="9" stroke="#fff" strokeWidth="1.1" />
    <line x1="11.5" y1="6.5" x2="11.5" y2="11.5" stroke="#fff" strokeWidth="0.9" />
    <line x1="14.5" y1="6.5" x2="14.5" y2="11.5" stroke="#fff" strokeWidth="0.9" />
  </svg>
)

function Ball({ scene, phase, speed }: { scene: Scene; phase: Phase; speed: number }) {
  const b = scene.ball
  if (!b) return null
  const live = phase !== 'pre'
  const lefts = b.u.map(u => `${uPct(u)}%`)
  const tops = b.v.map(v => `${vPct(v)}%`)
  const trans = {
    duration: b.dur / speed,
    times: b.times,
    ease: 'easeInOut' as const,
  }
  return (
    <>
      {/* iz (ghost'lar) */}
      {live && [0.09, 0.17].map((d, i) => (
        <motion.div key={'g' + i} className="absolute z-[14] -ml-3 -mt-2 pointer-events-none"
          initial={{ left: lefts[0], top: tops[0], opacity: 0 }}
          animate={{ left: lefts, top: tops, opacity: [0, 0.28 - i * 0.1, 0.28 - i * 0.1, 0.28 - i * 0.1, 0] }}
          transition={{ ...trans, delay: d / speed }}>
          <div className="w-3 h-3 rounded-full bg-amber-200/70 blur-[3px]" />
        </motion.div>
      ))}
      {/* gölge */}
      {live && (
        <motion.div className="absolute z-[13] -ml-2 -mt-0.5 pointer-events-none"
          initial={{ left: lefts[0], top: tops[0] }}
          animate={{ left: lefts, top: tops.map(() => tops[tops.length - 1]), opacity: [0.35, 0.15, 0.1, 0.25, 0.35], scale: b.scale.map(s => 2 - s * 0.6) }}
          transition={trans}>
          <div className="w-4 h-1.5 rounded-full bg-black/50 blur-[2px]" />
        </motion.div>
      )}
      {/* top */}
      <motion.div className="absolute z-[15] -ml-3 -mt-2 pointer-events-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]"
        initial={{ left: lefts[0], top: tops[0], scale: 1, rotate: 0 }}
        animate={live
          ? { left: lefts, top: tops, scale: b.scale, rotate: b.spin, opacity: b.opacity }
          : { left: lefts[0], top: tops[0], scale: [1, 1.12, 1], rotate: 0 }}
        transition={live ? { ...trans, rotate: { duration: b.dur / speed, ease: 'linear' } } : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}>
        <BallSvg />
      </motion.div>
    </>
  )
}

/* ============================== EFEKT PARÇALARI ============================== */
function ImpactBurst({ pt, delay }: { pt: { u: number; v: number }; delay: number }) {
  const bits = useMemo(() => Array.from({ length: 9 }).map((_, i) => {
    const a = (i / 9) * Math.PI * 2
    return { dx: Math.cos(a) * 26, dy: Math.sin(a) * 20, i }
  }), [])
  return (
    <div className="absolute z-[16] pointer-events-none" style={{ left: `${uPct(pt.u)}%`, top: `${vPct(pt.v)}%` }}>
      <motion.div className="absolute -ml-4 -mt-4 w-8 h-8 rounded-full border-2 border-white/80"
        initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.55, delay, ease: 'easeOut' }} />
      {bits.map(b => (
        <motion.div key={b.i} className="absolute w-1.5 h-1.5 -ml-0.5 -mt-0.5 rounded-full bg-white"
          initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: b.dx, y: b.dy, opacity: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.02 * b.i, ease: 'easeOut' }} />
      ))}
    </div>
  )
}

function PenaltyFlag({ losU, speed }: { losU: number; speed: number }) {
  return (
    <motion.div className="absolute z-[18] pointer-events-none"
      initial={{ left: `${uPct(losU) - 4}%`, top: '-6%', rotate: 0, opacity: 0 }}
      animate={{ left: `${uPct(losU)}%`, top: ['-6%', '30%', '52%'], rotate: 720, opacity: 1 }}
      transition={{ duration: 0.9 / speed, delay: 0.3 / speed, ease: 'easeIn' }}>
      <div className="w-3.5 h-3.5 bg-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.9)]" style={{ clipPath: 'polygon(0 0, 100% 20%, 80% 100%, 10% 80%)' }} />
    </motion.div>
  )
}

/* skewed broadcast banner */
function EventBanner({ scene }: { scene: Scene }) {
  const b = scene.banner!
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
      <motion.div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${b.glow} 0%, transparent 62%)` }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.45] }} transition={{ duration: 0.8, times: [0, 0.35, 1] }} />
      <motion.div
        initial={{ x: '-130%', skewX: -12 }} animate={{ x: 0, skewX: -12 }}
        transition={{ type: 'spring', damping: 16, stiffness: 220 }}
        className="relative px-8 md:px-14 py-2.5 md:py-4"
        style={{ background: b.grad, boxShadow: `0 8px 40px ${b.glow}, inset 0 1px 0 rgba(255,255,255,0.5)` }}>
        <motion.div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute top-0 bottom-0 w-1/3 bg-white/40 blur-md"
            initial={{ left: '-40%' }} animate={{ left: '130%' }} transition={{ duration: 0.9, delay: 0.25, ease: 'easeInOut' }} />
        </motion.div>
        <div className="skew-x-12 text-center">
          <div className="font-display font-black text-3xl md:text-6xl tracking-[0.12em] text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]">{b.label}</div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="mt-2 md:mt-3 px-4 py-1 rounded-full bg-black/70 border border-white/20 text-white/90 font-display font-bold tracking-[0.2em] text-[10px] md:text-sm">
        {b.sub}
      </motion.div>
      {scene.chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 justify-center px-4">
          {scene.chips.map((c, i) => (
            <motion.span key={c} initial={{ opacity: 0, scale: 0.5, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.12, type: 'spring', damping: 12 }}
              className="px-2.5 py-0.5 rounded-full bg-white/12 backdrop-blur border border-white/25 text-[10px] md:text-xs font-bold text-white tracking-wider">
              {c}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  )
}

/* banner'sız oyunlarda trait/first-down çipleri */
function ChipStinger({ chips }: { chips: string[] }) {
  return (
    <div className="absolute inset-x-0 bottom-[12%] z-40 flex justify-center gap-1.5 pointer-events-none px-4 flex-wrap">
      {chips.map((c, i) => (
        <motion.span key={c}
          initial={{ opacity: 0, y: 16, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.1, type: 'spring', damping: 11, stiffness: 200 }}
          className={`px-3 py-1 rounded-md font-display font-black tracking-widest text-[11px] md:text-sm border shadow-lg ${c.includes('FIRST DOWN')
            ? 'bg-yellow-400 text-black border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.55)]'
            : 'bg-black/75 text-white border-white/25 backdrop-blur'}`}>
          {c}
        </motion.span>
      ))}
    </div>
  )
}

function CoachPopup({ note }: { note: string }) {
  const good = note.includes('BAŞARILI')
  return (
    <motion.div initial={{ opacity: 0, y: -18, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -10, x: '-50%' }}
      className="absolute top-2 left-1/2 z-40 max-w-[92%] md:max-w-[70%] pointer-events-none">
      <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 backdrop-blur-md shadow-xl ${good ? 'bg-emerald-950/80 border-emerald-400/50' : 'bg-red-950/80 border-red-400/50'}`}>
        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${good ? 'bg-emerald-400/20' : 'bg-red-400/20'}`}>
          <Brain className={`w-4 h-4 ${good ? 'text-emerald-300' : 'text-red-300'}`} />
        </div>
        <div>
          <div className={`text-[9px] font-black tracking-[0.25em] uppercase ${good ? 'text-emerald-300' : 'text-red-300'}`}>Taktik Masası</div>
          <div className="text-white/90 text-[11px] md:text-xs font-semibold leading-tight">{note}</div>
        </div>
      </div>
    </motion.div>
  )
}

/* ============================== ANA SAHNE ============================== */
export interface StageProps {
  log: PlayLog
  idx: number
  speed: number
  muted: boolean
  homeName: string
  awayName: string
  onPhase?: (p: Phase) => void
  onDone?: () => void
}

export function CinematicStage({ log, idx, speed, muted, homeName, awayName, onPhase, onDone }: StageProps) {
  const scene = useMemo(() => buildScene(log, idx), [log, idx])
  // faz idx'e bağlı türetilir: yeni oyun geldiğinde otomatik 'pre'ye döner
  const [phaseMark, setPhaseMark] = useState<{ i: number; p: Phase }>({ i: -1, p: 'pre' })
  const phase: Phase = phaseMark.i === idx ? phaseMark.p : 'pre'
  const [burst, setBurst] = useState<{ id: number; kind: 'td' | 'fg' } | null>(null)
  const cbRef = useRef({ onPhase, onDone, muted })
  useEffect(() => { cbRef.current = { onPhase, onDone, muted } }, [onPhase, onDone, muted])

  /* faz zamanlayıcı */
  useEffect(() => {
    const sp = Math.max(0.25, speed)
    const t1 = setTimeout(() => { setPhaseMark({ i: idx, p: 'live' }); cbRef.current.onPhase?.('live') }, scene.durs.pre / sp)
    const t2 = setTimeout(() => {
      setPhaseMark({ i: idx, p: 'result' }); cbRef.current.onPhase?.('result')
      playSfx(scene.sfx, cbRef.current.muted)
      if (log.event === 'touchdown') setBurst({ id: idx, kind: 'td' })
      else if (log.event === 'fg_good') setBurst({ id: idx, kind: 'fg' })
    }, (scene.durs.pre + scene.durs.live) / sp)
    const t3 = setTimeout(() => cbRef.current.onDone?.(), sceneTotal(scene) / sp)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [scene, idx, speed, log.event])

  const { cam } = scene
  const tx = (f: number) => -(f - 50) * cam.s
  const offColor = log.possession === 'home' ? HOME_COLOR : AWAY_COLOR
  const defColor = log.possession === 'home' ? AWAY_COLOR : HOME_COLOR
  const showGain = phase === 'result' && scene.rich && scene.gain !== 0 && !scene.banner
  const isTD = log.event === 'touchdown'

  return (
    <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/15 shadow-[0_18px_60px_rgba(0,0,0,0.6)] bg-[#0a1f12]">
      {/* tribün çerçevesi */}
      <div className="absolute inset-x-0 top-0 h-[6.5%] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(180deg,#060d18 20%,rgba(6,13,24,0))', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.4px)', backgroundSize: '7px 5px' }} />
      <div className="absolute inset-x-0 bottom-0 h-[6.5%] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(0deg,#060d18 20%,rgba(6,13,24,0))', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.4px)', backgroundSize: '7px 5px' }} />
      {/* TD anında tribün flaşları */}
      {isTD && phase === 'result' && (
        <motion.div className="absolute inset-x-0 top-0 h-[6.5%] z-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1.6px)', backgroundSize: '13px 6px' }}
          animate={{ opacity: [0, 0.9, 0.1, 0.7, 0] }} transition={{ duration: 1.6, times: [0, 0.15, 0.4, 0.6, 1] }} />
      )}

      {/* KAMERA */}
      <motion.div
        className="will-change-transform"
        style={{ transformOrigin: '50% 50%' }}
        animate={{
          scale: scene.rich ? cam.s : 1,
          x: scene.rich ? (phase === 'pre' ? `${tx(cam.fromU)}%` : `${tx(cam.toU)}%`) : '0%',
        }}
        transition={phase === 'pre'
          ? { duration: 0.6 / speed, ease: 'easeInOut' }
          : { duration: (scene.ball ? scene.ball.dur : 0.8) / speed, ease: 'easeInOut', delay: 0.12 / speed }}
      >
        <div className="relative">
          <FieldSVG homeName={homeName} awayName={awayName} />

          {scene.rich && (
            <>
              {/* hücum yönü oku */}
              <motion.div className="absolute z-[8] pointer-events-none" style={{ left: `${uPct(scene.losU) + scene.dir * 3.2}%`, top: '47%' }}
                animate={{ opacity: [0.25, 0.6, 0.25], x: [0, scene.dir * 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                <div className="text-white font-black text-lg" style={{ transform: scene.dir === -1 ? 'scaleX(-1)' : undefined }}>➤</div>
              </motion.div>

              {/* scrimmage lazeri */}
              <div className="absolute top-[1.5%] bottom-[1.5%] w-[3px] z-[9] bg-sky-300 pointer-events-none"
                style={{ left: `${uPct(scene.losU)}%`, boxShadow: '0 0 10px #38bdf8, 0 0 22px #38bdf8' }} />
              {/* first down lazeri */}
              {scene.fdU !== null && (
                <motion.div className="absolute top-[1.5%] bottom-[1.5%] w-[3px] z-[9] bg-yellow-300 pointer-events-none"
                  style={{ left: `${uPct(scene.fdU)}%` }}
                  animate={{ boxShadow: ['0 0 8px #facc15', '0 0 20px #facc15', '0 0 8px #facc15'] }}
                  transition={{ duration: 1.4, repeat: Infinity }} />
              )}

              {/* kazanç şeridi */}
              <AnimatePresence>
                {showGain && (
                  <motion.div key={'gz' + idx}
                    className="absolute top-[1.5%] bottom-[1.5%] z-[7] pointer-events-none"
                    style={{
                      left: `${Math.min(uPct(scene.losU), uPct(scene.endU))}%`,
                      width: `${Math.abs(uPct(scene.endU) - uPct(scene.losU))}%`,
                      background: scene.gain > 0
                        ? 'linear-gradient(180deg, rgba(74,222,128,0.30), rgba(74,222,128,0.12))'
                        : 'linear-gradient(180deg, rgba(248,113,113,0.32), rgba(248,113,113,0.14))',
                      transformOrigin: scene.dir === 1 ? 'left' : 'right',
                    }}
                    initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }} />
                )}
              </AnimatePresence>

              {/* oyuncular */}
              {scene.sprites.map(s => (
                <PlayerDot key={idx + s.id} s={s} color={s.side === 'off' ? offColor : defColor} phase={phase} speed={speed} />
              ))}

              {/* top */}
              <Ball key={'b' + idx} scene={scene} phase={phase} speed={speed} />

              {/* çarpma efekti */}
              {phase === 'result' && scene.impact && <ImpactBurst pt={scene.impact} delay={0.05} />}

              {/* penaltı bayrağı */}
              {phase !== 'pre' && scene.flag && <PenaltyFlag losU={scene.losU} speed={speed} />}
            </>
          )}

          {/* legacy log kartı */}
          {!scene.rich && (
            <div className="absolute inset-0 z-[12] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-black/60 backdrop-blur rounded-2xl border border-white/15 px-6 py-4 text-center max-w-lg">
                <div className="text-white/80 text-sm md:text-base font-bold">{log.play || log.text || 'Oyun'}</div>
                {log.result && <div className="text-accent font-display font-black text-2xl mt-1">{log.result}</div>}
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* vinyet + ışık süpürmesi */}
      <div className="absolute inset-0 z-[22] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 58%, rgba(0,8,18,0.5) 100%)' }} />
      <motion.div className="absolute inset-y-0 w-1/4 z-[22] pointer-events-none bg-gradient-to-r from-transparent via-white/[0.045] to-transparent"
        animate={{ left: ['-30%', '110%'] }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} />

      {/* down & distance çipi */}
      {scene.rich && phase !== 'result' && (scene.downDist || scene.quarterLabel) && (
        <div className="absolute top-2 left-2 z-40 pointer-events-none">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-black/70 backdrop-blur rounded-lg border border-white/15 px-2.5 py-1">
            <span className="text-accent font-display font-black text-[11px] md:text-sm">{scene.quarterLabel}</span>
            {scene.downDist && <span className="text-white/85 font-bold text-[11px] md:text-sm tracking-wide">{scene.downDist}</span>}
          </motion.div>
        </div>
      )}

      {/* koç tahmini popup'ı */}
      <AnimatePresence>
        {phase === 'pre' && scene.coachNote && <CoachPopup note={scene.coachNote} />}
      </AnimatePresence>

      {/* event banner / çip stinger */}
      <AnimatePresence>
        {phase === 'result' && scene.banner && <EventBanner key={'bn' + idx} scene={scene} />}
        {phase === 'result' && !scene.banner && scene.chips.length > 0 && <ChipStinger key={'cs' + idx} chips={scene.chips} />}
      </AnimatePresence>

      {/* konfeti / havai fişek */}
      <FxCanvas burst={burst} />
    </div>
  )
}
