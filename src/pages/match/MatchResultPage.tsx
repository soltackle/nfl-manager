import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { Trophy, Activity, Play, Pause, SkipForward, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { motion, AnimatePresence } from 'framer-motion'

const TOUCHDOWN_SOUND = typeof Audio !== 'undefined' ? new Audio('/sounds/Touchdown.mp3') : null

/* ----------------------------- helpers ----------------------------- */
const isRich = (l: any) => !!l && l.possession && l.startYard !== undefined && l.startYard !== null
const yardToPct = (yardLine: number, possession: string) => {
  const u = possession === 'home' ? 100 + yardLine * 10 : 1100 - yardLine * 10
  return Math.max(0, Math.min(100, (u / 1200) * 100))
}
const parseClock = (time: any) => {
  if (!time) return { q: '', dd: '' }
  if (time === 'BAŞLANGIÇ') return { q: 'KICKOFF', dd: '' }
  if (time === 'OT') return { q: 'UZATMA', dd: '' }
  const parts = String(time).split('|').map(s => s.trim())
  return { q: parts[0] || '', dd: parts[1] || '' }
}
const tdPoints = (text: string) => {
  if (text?.includes('2-POINT BAŞARILI')) return 8
  if (text?.includes('2-POINT BAŞARISIZ') || text?.includes('Ekstra Puan KAÇTI')) return 6
  return 7
}
function buildScores(logs: any[]) {
  let h = 0, a = 0
  return logs.map((l) => {
    const t = l.text || ''
    if (l.event === 'touchdown') { const p = tdPoints(t); if (l.possession === 'home') h += p; else a += p }
    else if (l.event === 'fg_good') { if (l.possession === 'home') h += 3; else a += 3 }
    else if (l.event === 'safety') { if (l.possession === 'home') a += 2; else h += 2 }
    return { h, a }
  })
}
function buildDrives(logs: any[]) {
  const drives: any[] = []
  let cur: any = null
  for (const l of logs) {
    if (!isRich(l)) continue
    if (l.playType === 'kickoff') continue
    if (!cur || cur.possession !== l.possession) {
      if (cur) drives.push(cur)
      cur = { possession: l.possession, plays: [], startYard: l.startYard, endYard: l.endYard, result: '—' }
    }
    cur.plays.push(l)
    cur.endYard = l.endYard
    if (l.event === 'touchdown') cur.result = 'TOUCHDOWN'
    else if (l.event === 'fg_good') cur.result = 'FIELD GOAL'
    else if (l.event === 'fg_miss') cur.result = 'FG KAÇTI'
    else if (l.event === 'interception') cur.result = 'INTERCEPTION'
    else if (l.event === 'fumble') cur.result = 'FUMBLE'
    else if (l.event === 'safety') cur.result = 'SAFETY'
    else if (l.playType === 'punt') cur.result = 'PUNT'
    else if (l.event === 'turnover') cur.result = 'TURNOVER'
  }
  if (cur) drives.push(cur)
  return drives
}
const EVENT_STYLE: any = {
  touchdown: { label: 'TOUCHDOWN', color: '#ffd000', glow: 'rgba(255,208,0,0.6)' },
  interception: { label: 'INTERCEPTION', color: '#ff4d4d', glow: 'rgba(255,77,77,0.6)' },
  fumble: { label: 'FUMBLE', color: '#ff4d4d', glow: 'rgba(255,77,77,0.6)' },
  sack: { label: 'SACK', color: '#b070ff', glow: 'rgba(176,112,255,0.6)' },
  fg_good: { label: 'FIELD GOAL', color: '#4ade80', glow: 'rgba(74,222,128,0.6)' },
  fg_miss: { label: 'KAÇTI', color: '#ff8888', glow: 'rgba(255,136,136,0.5)' },
  safety: { label: 'SAFETY', color: '#ff8800', glow: 'rgba(255,136,0,0.6)' },
  turnover: { label: 'TURNOVER', color: '#ff4d4d', glow: 'rgba(255,77,77,0.6)' },
}

/* ----------------------------- confetti ----------------------------- */
const Confetti = () => {
  const bits = useMemo(() => Array.from({ length: 36 }).map((_, i) => ({
    id: i, x: Math.random() * 100, c: ['#ffd000', '#ff9c00', '#00a2ff', '#ffffff', '#4ade80'][i % 5],
    delay: Math.random() * 0.3, dur: 1.2 + Math.random() * 1.2, rot: Math.random() * 360,
  })), [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-40">
      {bits.map(b => (
        <motion.div key={b.id}
          initial={{ y: -20, x: `${b.x}%`, opacity: 1, rotate: 0 }}
          animate={{ y: '120%', rotate: b.rot + 360, opacity: [1, 1, 0] }}
          transition={{ duration: b.dur, delay: b.delay, ease: 'easeIn' }}
          className="absolute top-0 w-2 h-3 rounded-sm"
          style={{ background: b.c }} />
      ))}
    </div>
  )
}

/* ----------------------------- football field ----------------------------- */
const FootballField = ({ log, speed }: { log: any; speed: number }) => {
  if (!log) return null
  const rich = isRich(log)

  if (!rich) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-900/60 bg-gradient-to-b from-emerald-700 to-emerald-800 p-6 text-center">
        <div className="text-white/70 text-sm font-bold uppercase tracking-widest">{log.play || log.text || 'Oyun'}</div>
        {log.result && <div className="text-accent font-display font-black text-2xl mt-1">{log.result}</div>}
      </div>
    )
  }

  const startX = yardToPct(log.startYard, log.possession)
  const endX = yardToPct(log.endYard, log.possession)
  const { dd } = parseClock(log.time)
  const distMatch = String(dd).match(/&\s*(\d+)/)
  const distance = distMatch ? parseInt(distMatch[1]) : 10
  const firstDownYard = Math.min(100, log.startYard + distance)
  const firstX = yardToPct(firstDownYard, log.possession)

  const isPass = log.playType === 'deep_bomb' || log.playType === 'short_pass' || log.playType === 'play_action'
  const isKick = log.playType === 'fg' || log.playType === 'punt'
  const arc = (isPass || isKick) ? (log.playType === 'deep_bomb' || isKick ? -42 : -22) : 0
  const duration = (1.4 / speed)
  const ev = log.event && EVENT_STYLE[log.event]
  const gain = log.endYard - log.startYard
  const dirRight = log.possession === 'home'

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
      <svg viewBox="0 0 1200 533" className="w-full block">
        <defs>
          <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f8a4c" /><stop offset="1" stopColor="#15663a" />
          </linearGradient>
        </defs>
        {/* turf stripes */}
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={i * 100} y="0" width="100" height="533" fill={i % 2 ? '#178a47' : '#149040'} />
        ))}
        <rect x="0" y="0" width="1200" height="533" fill="url(#turf)" opacity="0.25" />
        {/* end zones */}
        <rect x="0" y="0" width="100" height="533" fill="#00254c" />
        <rect x="1100" y="0" width="100" height="533" fill="#7a3b00" />
        <text x="50" y="266" fill="#ffffff" fontSize="42" fontWeight="900" textAnchor="middle" transform="rotate(-90 50 266)" opacity="0.55" letterSpacing="6">HOME</text>
        <text x="1150" y="266" fill="#ffffff" fontSize="42" fontWeight="900" textAnchor="middle" transform="rotate(90 1150 266)" opacity="0.55" letterSpacing="6">AWAY</text>
        {/* sidelines */}
        <rect x="100" y="6" width="1000" height="521" fill="none" stroke="#ffffff" strokeWidth="5" opacity="0.85" />
        {/* yard lines every 5 yds (50u) */}
        {Array.from({ length: 21 }).map((_, i) => {
          const x = 100 + i * 50
          const major = i % 2 === 0
          return <line key={i} x1={x} y1="6" x2={x} y2="527" stroke="#ffffff" strokeWidth={major ? 3 : 1.4} opacity={major ? 0.85 : 0.45} />
        })}
        {/* hash marks */}
        {Array.from({ length: 101 }).map((_, i) => {
          const x = 100 + i * 10
          if (x <= 100 || x >= 1100) return null
          return <g key={i}>
            <line x1={x} y1="170" x2={x} y2="185" stroke="#ffffff" strokeWidth="1.4" opacity="0.5" />
            <line x1={x} y1="348" x2={x} y2="363" stroke="#ffffff" strokeWidth="1.4" opacity="0.5" />
          </g>
        })}
        {/* yard numbers */}
        {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((n, i) => {
          const x = 200 + i * 100
          return <g key={i} fill="#ffffff" opacity="0.7" fontWeight="800" fontSize="40">
            <text x={x} y="80" textAnchor="middle">{n}</text>
            <text x={x} y="500" textAnchor="middle">{n}</text>
          </g>
        })}
        {/* midfield star */}
        <text x="600" y="285" textAnchor="middle" fill="#ff9c00" fontSize="64" opacity="0.35">★</text>
      </svg>

      {/* line of scrimmage */}
      <motion.div className="absolute top-0 bottom-0 w-[3px] bg-sky-400 shadow-[0_0_12px_#38bdf8] z-10"
        animate={{ left: `${startX}%` }} transition={{ duration: 0.3 }} />
      {/* first down line */}
      {log.playType !== 'fg' && log.playType !== 'punt' && (
        <div className="absolute top-0 bottom-0 w-[3px] bg-yellow-400 shadow-[0_0_12px_#facc15] z-10" style={{ left: `${firstX}%` }} />
      )}

      {/* ball + trail */}
      <motion.div key={String(log.time) + String(log.text).slice(0, 12)}
        className="absolute z-20 -ml-3 -mt-3"
        initial={{ left: `${startX}%`, top: '50%', rotate: 0, scale: 1 }}
        animate={{ left: `${endX}%`, top: ['50%', `${50 + arc}%`, '50%'], rotate: isPass ? 1080 : 360, scale: (log.playType === 'deep_bomb' || isKick) ? [1, 1.5, 1] : [1, 1.15, 1] }}
        transition={{ duration, ease: 'easeInOut' }}>
        <svg width="26" height="18" viewBox="0 0 26 18">
          <ellipse cx="13" cy="9" rx="12" ry="7.5" fill="#8a4b1e" stroke="#5e3212" strokeWidth="1.5" />
          <line x1="13" y1="3.5" x2="13" y2="14.5" stroke="#fff" strokeWidth="1.4" />
          <line x1="10" y1="9" x2="16" y2="9" stroke="#fff" strokeWidth="1.2" />
          <line x1="11.5" y1="6.5" x2="11.5" y2="11.5" stroke="#fff" strokeWidth="0.9" />
          <line x1="14.5" y1="6.5" x2="14.5" y2="11.5" stroke="#fff" strokeWidth="0.9" />
        </svg>
      </motion.div>

      {/* gain badge */}
      <AnimatePresence>
        {!ev && gain !== 0 && (
          <motion.div key={'g' + log.time} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ delay: duration * 0.7 }}
            className={`absolute z-30 top-2 ${dirRight ? 'right-3' : 'left-3'} px-2.5 py-1 rounded-md text-xs font-display font-black ${gain > 0 ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
            {gain > 0 ? '+' : ''}{gain} YD
          </motion.div>
        )}
      </AnimatePresence>

      {/* event flash */}
      <AnimatePresence>
        {ev && (
          <>
            <motion.div key={'flash' + log.time} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 0.7, delay: duration * 0.6 }}
              className="absolute inset-0 z-30" style={{ background: ev.glow }} />
            <motion.div key={'evt' + log.time}
              initial={{ opacity: 0, scale: 0.4, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', damping: 9, stiffness: 120, delay: duration * 0.6 }}
              className="absolute inset-0 z-40 flex items-center justify-center">
              <span className="font-display font-black tracking-widest text-3xl md:text-5xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
                style={{ color: ev.color, textShadow: `0 0 24px ${ev.glow}` }}>{ev.label}!</span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ----------------------------- momentum chart ----------------------------- */
const MomentumChart = ({ scores }: { scores: any[] }) => {
  if (!scores || scores.length < 2) return null
  const W = 600, H = 120, mid = H / 2
  const diffs = scores.map(s => s.h - s.a)
  const maxAbs = Math.max(8, ...diffs.map(d => Math.abs(d)))
  const pts = diffs.map((d, i) => {
    const x = (i / (diffs.length - 1)) * W
    const y = mid - (d / maxAbs) * (mid - 8)
    return [x, y]
  })
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${W} ${mid} L0 ${mid} Z`
  return (
    <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] rounded-xl border border-[#005c99]/50 p-5">
      <h2 className="text-sm font-display font-bold text-accent uppercase mb-3">Momentum (Skor Farkı)</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="#ffffff" strokeWidth="1" opacity="0.25" strokeDasharray="4 4" />
        <path d={area} fill="#00a2ff" opacity="0.18" />
        <path d={line} fill="none" stroke="#00a2ff" strokeWidth="2.5" />
        <text x="6" y="14" fill="#00a2ff" fontSize="11" fontWeight="700" opacity="0.7">EV ÖNDE</text>
        <text x="6" y={H - 6} fill="#ff9c00" fontSize="11" fontWeight="700" opacity="0.7">DEPLASMAN ÖNDE</text>
      </svg>
    </div>
  )
}

/* ----------------------------- drives ----------------------------- */
const DrivesPanel = ({ drives, match }: any) => {
  const [open, setOpen] = useState<number | null>(null)
  if (!drives || drives.length === 0) return null
  const resColor = (r: string) => r === 'TOUCHDOWN' ? 'text-yellow-400' : r === 'FIELD GOAL' ? 'text-green-400'
    : (r === 'INTERCEPTION' || r === 'FUMBLE' || r === 'TURNOVER' || r === 'SAFETY') ? 'text-red-400' : 'text-white/50'
  return (
    <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] rounded-xl border border-[#005c99]/50 p-5">
      <h2 className="text-sm font-display font-bold text-accent uppercase mb-4">Hücum Serileri (Drives)</h2>
      <div className="space-y-2">
        {drives.map((d: any, i: number) => {
          const name = d.possession === 'home' ? (match?.home_franchise?.team_name || 'Ev Sahibi') : (match?.away_franchise?.team_name || 'Deplasman')
          const net = (d.endYard ?? d.startYard) - d.startYard
          const lo = Math.min(d.startYard, d.endYard ?? d.startYard), hi = Math.max(d.startYard, d.endYard ?? d.startYard)
          return (
            <div key={i} className="rounded-lg border border-white/10 overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-3 p-3 bg-black/30 hover:bg-black/40 transition text-left">
                <div className={`w-2 h-8 rounded-full ${d.possession === 'home' ? 'bg-[#00a2ff]' : 'bg-accent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{name}</div>
                  <div className="text-white/40 text-[11px]">{d.plays.length} oyun · {net >= 0 ? '+' : ''}{net} yarda</div>
                </div>
                <div className="relative w-24 h-2 bg-white/10 rounded-full hidden sm:block">
                  <div className="absolute h-2 bg-white/40 rounded-full" style={{ left: `${lo}%`, width: `${Math.max(3, hi - lo)}%` }} />
                </div>
                <div className={`font-display font-black text-xs ${resColor(d.result)}`}>{d.result}</div>
                <ChevronDown className={`w-4 h-4 text-white/40 transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="bg-black/40 p-3 space-y-1.5">
                  {d.plays.map((p: any, j: number) => (
                    <div key={j} className="text-[12px] text-white/70 flex gap-2">
                      <span className="text-white/30 font-mono shrink-0">{parseClock(p.time).dd || '•'}</span>
                      <span>{p.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ----------------------------- stats ----------------------------- */
const StatsPanel = ({ logs, match }: any) => {
  const s = useMemo(() => {
    const cnt = (poss: string, ev: string) => logs.filter((l: any) => l.possession === poss && l.event === ev).length
    const yards = (poss: string) => logs.filter((l: any) => isRich(l) && l.possession === poss).reduce((a: number, l: any) => a + Math.max(0, l.endYard - l.startYard), 0)
    const plays = (poss: string) => logs.filter((l: any) => isRich(l) && l.possession === poss && l.playType !== 'kickoff').length
    // player of the match: most frequent name in parentheses among scoring/big plays
    const names: any = {}
    logs.forEach((l: any) => {
      if (['touchdown', 'interception', 'sack', 'fumble', 'fg_good'].includes(l.event)) {
        const m = String(l.text || '').match(/\(([^)]+)\)/g) || []
        m.forEach((x: string) => { const n = x.slice(1, -1); names[n] = (names[n] || 0) + 1 })
      }
    })
    const mvp = Object.entries(names).sort((a: any, b: any) => b[1] - a[1])[0]
    return { yards, plays, cnt, mvp }
  }, [logs])

  const rows = [
    { label: 'Toplam Yarda', h: s.yards('home'), a: s.yards('away'), c: 'text-accent' },
    { label: 'Oyun Sayısı', h: s.plays('home'), a: s.plays('away'), c: 'text-white' },
    { label: 'Touchdown', h: s.cnt('home', 'touchdown'), a: s.cnt('away', 'touchdown'), c: 'text-yellow-400' },
    { label: 'Field Goal', h: s.cnt('home', 'fg_good'), a: s.cnt('away', 'fg_good'), c: 'text-green-400' },
    { label: 'Interception', h: s.cnt('home', 'interception'), a: s.cnt('away', 'interception'), c: 'text-red-400' },
    { label: 'Fumble', h: s.cnt('home', 'fumble'), a: s.cnt('away', 'fumble'), c: 'text-red-400' },
    { label: 'Sack', h: s.cnt('home', 'sack'), a: s.cnt('away', 'sack'), c: 'text-purple-400' },
  ]
  return (
    <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] rounded-xl border border-[#005c99]/50 p-5">
      <h2 className="text-sm font-display font-bold text-accent uppercase mb-5 flex items-center gap-2"><Trophy className="w-4 h-4" /> Maç İstatistikleri</h2>
      {s.mvp && (
        <div className="mb-5 flex items-center justify-center gap-3 bg-accent/10 border border-accent/30 rounded-xl py-3">
          <Trophy className="w-5 h-5 text-accent" />
          <div className="text-center">
            <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Maçın Oyuncusu</div>
            <div className="text-white font-display font-black text-lg">{(s.mvp as any)[0]}</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center mb-1">
        <div className="text-xs font-bold text-white/50 uppercase truncate">{match?.home_franchise?.team_name}</div>
        <div className="text-[10px] font-bold text-white/30 uppercase">İSTATİSTİK</div>
        <div className="text-xs font-bold text-white/50 uppercase truncate">{match?.away_franchise?.team_name}</div>
      </div>
      {rows.map(r => (
        <div key={r.label} className="grid grid-cols-3 gap-2 items-center py-2 border-b border-white/5">
          <div className={`text-center font-display font-black text-lg ${r.h >= r.a ? r.c : 'text-white/40'}`}>{r.h}</div>
          <div className="text-center text-[11px] font-bold text-white/50 uppercase">{r.label}</div>
          <div className={`text-center font-display font-black text-lg ${r.a >= r.h ? r.c : 'text-white/40'}`}>{r.a}</div>
        </div>
      ))}
    </div>
  )
}

/* ----------------------------- main ----------------------------- */
export function MatchResultPage() {
  const { id } = useParams()
  const [state, setState] = useState<'idle' | 'playing' | 'paused' | 'finished'>('idle')
  const [idx, setIdx] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const idxRef = useRef(0)

  const fetcher = async () => {
    if (!id) return null
    const { data: matchData, error } = await supabase
      .from('matches')
      .select('*, home_franchise:franchises!matches_home_franchise_id_fkey(team_name), away_franchise:franchises!matches_away_franchise_id_fkey(team_name)')
      .eq('id', id).single()
    if (error) throw error
    const { data: logsData } = await supabase.from('match_drive_logs').select('*').eq('match_id', id).limit(1).maybeSingle()
    return { match: matchData, logs: (logsData?.plays as any[]) || [] }
  }
  const { data, isLoading } = useSWR(id ? `match-${id}` : null, fetcher)

  const logs: any[] = data?.logs || []
  const scores = useMemo(() => buildScores(logs), [logs])
  const drives = useMemo(() => buildDrives(logs), [logs])

  useEffect(() => { if (id) localStorage.setItem('lastViewedMatchId', id) }, [id])

  // playback ticker
  useEffect(() => {
    if (state !== 'playing' || logs.length === 0) return
    const t = setInterval(() => {
      const next = idxRef.current + 1
      if (next >= logs.length) {
        idxRef.current = logs.length - 1
        setIdx(logs.length - 1)
        setState('finished')
        clearInterval(t)
        return
      }
      idxRef.current = next
      setIdx(next)
      const cur = logs[next]
      if (cur?.event === 'touchdown') {
        try { if (TOUCHDOWN_SOUND) { TOUCHDOWN_SOUND.currentTime = 0; TOUCHDOWN_SOUND.play().catch(() => {}) } } catch { /* noop */ }
        setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2200)
      }
    }, 2100 / speed)
    return () => clearInterval(t)
  }, [state, logs, speed])

  if (isLoading) return (
    <div className="space-y-4 pt-4 max-w-4xl mx-auto px-4">
      <Skeleton className="h-44 w-full bg-white/5 rounded-xl" />
      <Skeleton className="h-72 w-full bg-white/5 rounded-xl" />
    </div>
  )
  if (!data?.match) return <div className="text-center mt-10 text-white/50">Maç bulunamadı.</div>

  const match: any = data.match
  const homeName = match.home_franchise?.team_name || 'Ev Sahibi'
  const awayName = match.away_franchise?.team_name || 'Deplasman'
  const live = state === 'playing' || state === 'paused'
  const curLog = logs[idx]
  const curScore = state === 'finished' ? { h: match.home_score, a: match.away_score } : (scores[idx] || { h: 0, a: 0 })
  const { q, dd } = parseClock(curLog?.time)
  const poss = curLog?.possession

  const skipToEnd = () => { idxRef.current = logs.length - 1; setIdx(logs.length - 1); setState('finished') }

  /* ---------- idle / kickoff card ---------- */
  if (state === 'idle') {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">
        <div className="relative rounded-2xl overflow-hidden border border-[#005c99]/50 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
          style={{ backgroundImage: "linear-gradient(180deg,rgba(0,21,43,0.82),rgba(0,16,33,0.95)), url('/stadium_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="p-8 md:p-14 text-center">
            <div className="inline-flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-1 mb-8">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-white/70 font-bold uppercase tracking-widest text-xs">Hafta {match.week} · Maç Günü</span>
            </div>
            <div className="flex items-center justify-center gap-4 md:gap-10 mb-12">
              <div className="flex-1 text-right text-xl md:text-3xl font-display font-black text-white uppercase">{homeName}</div>
              <div className="bg-[#00254c] border-2 border-accent/40 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shrink-0">
                <span className="text-accent font-display font-black text-lg">VS</span>
              </div>
              <div className="flex-1 text-left text-xl md:text-3xl font-display font-black text-white uppercase">{awayName}</div>
            </div>
            <button onClick={() => { idxRef.current = 0; setIdx(0); setState('playing') }}
              className="bg-accent hover:bg-white text-[#001021] text-lg font-display font-black uppercase tracking-widest py-4 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-[0_0_30px_rgba(255,156,0,0.35)]">
              <Play className="w-6 h-6 fill-current" /> MAÇI İZLE
            </button>
            {logs.length === 0 && <p className="text-white/40 text-xs mt-6 uppercase tracking-widest">Bu maç henüz oynanmadı</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-24 space-y-5">
      {/* SCOREBOARD (sticky) */}
      <motion.div animate={curLog?.event === 'touchdown' ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.4 }}
        className="sticky top-2 z-30 rounded-2xl overflow-hidden border border-[#005c99] shadow-2xl">
        <div className="relative bg-gradient-to-b from-[#004b93] to-[#001f40] p-4 md:p-5">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            {/* home */}
            <div className="flex-1 min-w-0 text-right">
              <div className="text-white font-display font-black text-sm md:text-xl uppercase truncate">{homeName}</div>
              {poss === 'home' && live && <div className="inline-flex items-center gap-1 text-[10px] text-accent font-bold uppercase">🏈 Topta</div>}
            </div>
            {/* score */}
            <div className="flex items-center gap-2 shrink-0">
              <motion.div key={'h' + curScore.h} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                className={`bg-black/50 border-2 rounded-lg px-3 py-2 md:px-5 md:py-3 ${state === 'finished' && match.home_score > match.away_score ? 'border-[#00a2ff]' : 'border-white/10'}`}>
                <span className="text-3xl md:text-5xl font-display font-black text-white tabular-nums">{curScore.h}</span>
              </motion.div>
              <span className="text-white/30 font-black">-</span>
              <motion.div key={'a' + curScore.a} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                className={`bg-black/50 border-2 rounded-lg px-3 py-2 md:px-5 md:py-3 ${state === 'finished' && match.away_score > match.home_score ? 'border-accent' : 'border-white/10'}`}>
                <span className="text-3xl md:text-5xl font-display font-black text-white tabular-nums">{curScore.a}</span>
              </motion.div>
            </div>
            {/* away */}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-white font-display font-black text-sm md:text-xl uppercase truncate">{awayName}</div>
              {poss === 'away' && live && <div className="inline-flex items-center gap-1 text-[10px] text-accent font-bold uppercase justify-end w-full">Topta 🏈</div>}
            </div>
          </div>
          {/* status bar */}
          <div className="relative z-10 mt-3 flex items-center justify-center gap-3">
            {state === 'finished' ? (
              <span className="inline-flex items-center gap-2 bg-[#00254c] border border-white/15 rounded-full px-4 py-1 text-white font-display font-bold uppercase tracking-widest text-xs">
                <Trophy className="w-4 h-4 text-yellow-400" /> Maç Bitti
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-1 text-white font-display font-bold uppercase tracking-widest text-xs">
                <span className="text-accent">{q}</span>{dd && <span className="text-white/60">· {dd}</span>}
              </span>
            )}
          </div>
        </div>
        {/* controls */}
        {state !== 'finished' && (
          <div className="bg-[#00152b] border-t border-white/10 px-4 py-2 flex items-center justify-center gap-3">
            <button onClick={() => setState(state === 'playing' ? 'paused' : 'playing')} className="w-9 h-9 rounded-full bg-accent text-black flex items-center justify-center hover:bg-white transition">
              {state === 'playing' ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-1">
              <span className="text-white/40 text-[10px] font-bold uppercase">Hız</span>
              {[1, 2, 4].map(sp => (
                <button key={sp} onClick={() => setSpeed(sp)} className={`w-7 h-7 rounded-full text-xs font-bold transition ${speed === sp ? 'bg-accent text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>{sp}x</button>
              ))}
            </div>
            <button onClick={skipToEnd} className="w-9 h-9 rounded-full bg-white/10 text-white/80 flex items-center justify-center hover:bg-white/20 transition" title="Sona atla">
              <SkipForward className="w-4 h-4" />
            </button>
            <div className="text-white/30 text-[11px] font-mono ml-1">{idx + 1}/{logs.length}</div>
          </div>
        )}
      </motion.div>

      {/* FIELD */}
      {live && curLog && (
        <div className="relative">
          {showConfetti && <Confetti />}
          <FootballField log={curLog} speed={speed} />
          {curLog.text && (
            <motion.div key={'cap' + idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 bg-[#00152b] border border-white/10 rounded-xl p-3 text-white/90 text-sm md:text-base leading-snug">
              {curLog.text}
            </motion.div>
          )}
        </div>
      )}

      {/* FINISHED: momentum + drives + stats */}
      {state === 'finished' && logs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <MomentumChart scores={scores} />
          <StatsPanel logs={logs} match={match} />
          <DrivesPanel drives={drives} match={match} />
        </motion.div>
      )}

      {/* live play-by-play feed */}
      {live && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Activity className="w-5 h-5 text-accent" />
            <h2 className="text-base font-display font-bold text-white tracking-widest uppercase">Anlatım</h2>
          </div>
          <div className="space-y-2">
            {logs.slice(0, idx + 1).reverse().map((l: any, i: number) => {
              const { dd: d2 } = parseClock(l.time)
              const hot = !!(l.event && l.event !== 'incomplete' && l.event !== 'penalty')
              return (
                <div key={idx - i} className={`flex gap-3 p-3 rounded-xl border ${hot ? 'bg-gradient-to-r from-accent/20 to-black/30 border-accent/60' : 'bg-[#00152b] border-white/5'}`}>
                  <div className={`shrink-0 self-start rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${hot ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/50'}`}>{parseClock(l.time).q || '•'}{d2 ? ` ${d2}` : ''}</div>
                  <p className={`text-sm ${hot ? 'text-white font-semibold' : 'text-white/75'}`}>{l.text || l.play}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
