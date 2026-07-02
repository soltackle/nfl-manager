import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { Trophy, Activity, Play, Pause, SkipForward, ChevronDown, Volume2, VolumeX, RotateCcw, Zap } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { CinematicStage } from './watch/CinematicStage'
import {
  buildScores, buildDrives, momentumAt, parseClock, isRich, mulberry32,
  type PlayLog, type Phase, type Drive,
} from './watch/playbook'

/* ============================== yardımcı ui =============================== */

/* skor rakamı — değişince yukarı kayarak yenilenir */
function RollingScore({ value, hot }: { value: number; hot: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-black/60 border-2 rounded-xl px-3 py-1.5 md:px-5 md:py-2.5 transition-colors duration-500 ${hot ? 'border-yellow-400/80 shadow-[0_0_24px_rgba(255,208,0,0.35)]' : 'border-white/10'}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value}
          initial={{ y: '-105%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '105%', opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className="block text-3xl md:text-5xl font-display font-black text-white tabular-nums leading-none">
          {value}
        </motion.span>
      </AnimatePresence>
      {hot && (
        <motion.div className="absolute inset-0 bg-yellow-300/25" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.2 }} />
      )}
    </div>
  )
}

/* momentum şeridi */
function MomentumBar({ m }: { m: number }) {
  const pos = 50 + m / 2
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden bg-black/50">
      <div className="absolute inset-0 opacity-70" style={{ background: 'linear-gradient(90deg,#00a2ff 0%,rgba(255,255,255,0.12) 50%,#ff9c00 100%)' }} />
      <div className="absolute top-0 bottom-0 w-px bg-white/40 left-1/2" />
      <motion.div className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] border border-black/30"
        animate={{ left: `${Math.max(3, Math.min(97, pos))}%` }} transition={{ type: 'spring', damping: 20, stiffness: 120 }} />
    </div>
  )
}

/* çeyrek bazlı ilerleme */
function QuarterProgress({ logs, idx }: { logs: PlayLog[]; idx: number }) {
  const seg = useMemo(() => {
    const qOf = logs.map(l => {
      const q = parseClock(l.time).q
      if (q === 'UZATMA') return 5
      const n = parseInt(q); return Number.isFinite(n) && n >= 1 ? Math.min(5, n) : 1
    })
    const total = [1, 2, 3, 4, 5].map(q => qOf.filter(x => x === q).length)
    const done = [1, 2, 3, 4, 5].map(q => qOf.slice(0, idx + 1).filter(x => x === q).length)
    return { total, done, hasOT: total[4] > 0 }
  }, [logs, idx])
  const labels = ['1', '2', '3', '4', 'OT']
  return (
    <div className="flex items-center gap-1">
      {labels.map((lb, i) => {
        if (i === 4 && !seg.hasOT) return null
        const pct = seg.total[i] ? (seg.done[i] / seg.total[i]) * 100 : 0
        return (
          <div key={lb} className="flex-1 flex items-center gap-1">
            <div className="relative flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="absolute inset-y-0 left-0 bg-accent" animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
            </div>
            <span className={`text-[8px] font-black ${pct >= 100 ? 'text-accent' : 'text-white/35'}`}>{lb}</span>
          </div>
        )
      })}
    </div>
  )
}

/* final kutlama konfetisi */
function FinaleConfetti() {
  const bits = useMemo(() => {
    const r = mulberry32(20260702)
    return Array.from({ length: 44 }).map((_, i) => ({
      id: i, x: r() * 100, c: ['#ffd000', '#ff9c00', '#00a2ff', '#ffffff', '#4ade80'][i % 5],
      delay: r() * 0.5, dur: 1.6 + r() * 1.6, rot: r() * 720, w: 5 + r() * 5,
    }))
  }, [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {bits.map(b => (
        <motion.div key={b.id}
          initial={{ y: '-8%', x: `${b.x}%`, opacity: 1, rotate: 0 }}
          animate={{ y: '115%', rotate: b.rot, opacity: [1, 1, 0] }}
          transition={{ duration: b.dur, delay: b.delay, ease: 'easeIn' }}
          className="absolute top-0 rounded-[2px]"
          style={{ background: b.c, width: b.w, height: b.w * 1.5 }} />
      ))}
    </div>
  )
}

/* ============================== maç sonu panelleri ============================== */

function MomentumChart({ scores }: { scores: { h: number; a: number }[] }) {
  if (!scores || scores.length < 2) return null
  const W = 600, H = 120, mid = H / 2
  const diffs = scores.map(s => s.h - s.a)
  const maxAbs = Math.max(8, ...diffs.map(d => Math.abs(d)))
  const pts = diffs.map((d, i) => [(i / (diffs.length - 1)) * W, mid - (d / maxAbs) * (mid - 8)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${W} ${mid} L0 ${mid} Z`
  return (
    <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] rounded-xl border border-[#005c99]/50 p-5">
      <h2 className="text-sm font-display font-bold text-accent uppercase mb-3">Momentum (Skor Farkı)</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="#ffffff" strokeWidth="1" opacity="0.25" strokeDasharray="4 4" />
        <motion.path d={area} fill="#00a2ff" opacity="0.18" initial={{ opacity: 0 }} animate={{ opacity: 0.18 }} transition={{ duration: 0.8 }} />
        <motion.path d={line} fill="none" stroke="#00a2ff" strokeWidth="2.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
        <text x="6" y="14" fill="#00a2ff" fontSize="11" fontWeight="700" opacity="0.7">EV ÖNDE</text>
        <text x="6" y={H - 6} fill="#ff9c00" fontSize="11" fontWeight="700" opacity="0.7">DEPLASMAN ÖNDE</text>
      </svg>
    </div>
  )
}

function DrivesPanel({ drives, homeName, awayName }: { drives: Drive[]; homeName: string; awayName: string }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!drives || drives.length === 0) return null
  const resColor = (r: string) => r === 'TOUCHDOWN' ? 'text-yellow-400' : r === 'FIELD GOAL' ? 'text-green-400'
    : (r === 'INTERCEPTION' || r === 'FUMBLE' || r === 'TURNOVER' || r === 'SAFETY') ? 'text-red-400' : 'text-white/50'
  return (
    <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] rounded-xl border border-[#005c99]/50 p-5">
      <h2 className="text-sm font-display font-bold text-accent uppercase mb-4">Hücum Serileri (Drives)</h2>
      <div className="space-y-2">
        {drives.map((d, i) => {
          const name = d.possession === 'home' ? homeName : awayName
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
                  {d.plays.map((p, j) => (
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

function StatsPanel({ logs, homeName, awayName }: { logs: PlayLog[]; homeName: string; awayName: string }) {
  const s = useMemo(() => {
    const cnt = (poss: string, ev: string) => logs.filter(l => l.possession === poss && l.event === ev).length
    const yards = (poss: string) => logs.filter(l => isRich(l) && l.possession === poss).reduce((a, l) => a + Math.max(0, (l.endYard ?? 0) - (l.startYard ?? 0)), 0)
    const plays = (poss: string) => logs.filter(l => isRich(l) && l.possession === poss && l.playType !== 'kickoff').length
    const names: Record<string, number> = {}
    logs.forEach(l => {
      if (['touchdown', 'interception', 'sack', 'fumble', 'fg_good'].includes(l.event || '')) {
        const m = String(l.text || '').match(/\(([^)]+)\)/g) || []
        m.forEach(x => { const n = x.slice(1, -1); names[n] = (names[n] || 0) + 1 })
      }
    })
    const mvp = Object.entries(names).sort((a, b) => b[1] - a[1])[0]
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
            <div className="text-white font-display font-black text-lg">{s.mvp[0]}</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center mb-1">
        <div className="text-xs font-bold text-white/50 uppercase truncate">{homeName}</div>
        <div className="text-[10px] font-bold text-white/30 uppercase">İSTATİSTİK</div>
        <div className="text-xs font-bold text-white/50 uppercase truncate">{awayName}</div>
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

/* ============================== ANA SAYFA ============================== */

export function MatchResultPage() {
  const { id } = useParams()
  const [state, setState] = useState<'idle' | 'playing' | 'paused' | 'finished'>('idle')
  const [idx, setIdx] = useState(0)
  // faz, oyun indeksine bağlı türetilir: idx ilerleyince otomatik 'pre'ye döner
  const [phaseMark, setPhaseMark] = useState<{ i: number; p: Phase }>({ i: 0, p: 'pre' })
  const phase: Phase = phaseMark.i === idx ? phaseMark.p : 'pre'
  const [speed, setSpeed] = useState(1)
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('matchMuted') === '1' } catch { return false } })
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])
  const pendingAdvance = useRef(false)

  const fetcher = async () => {
    if (!id) return null
    const { data: matchData, error } = await supabase
      .from('matches')
      .select('*, home_franchise:franchises!matches_home_franchise_id_fkey(team_name), away_franchise:franchises!matches_away_franchise_id_fkey(team_name)')
      .eq('id', id).single()
    if (error) throw error
    const { data: logsData } = await supabase.from('match_drive_logs').select('*').eq('match_id', id).limit(1).maybeSingle()
    return { match: matchData, logs: ((logsData?.plays as PlayLog[]) || []) }
  }
  const { data, isLoading } = useSWR(id ? `match-${id}` : null, fetcher)

  const logs: PlayLog[] = useMemo(() => data?.logs || [], [data])
  const scores = useMemo(() => buildScores(logs), [logs])
  const drives = useMemo(() => buildDrives(logs), [logs])

  useEffect(() => { if (id) localStorage.setItem('lastViewedMatchId', id) }, [id])
  useEffect(() => { try { localStorage.setItem('matchMuted', muted ? '1' : '0') } catch { /* noop */ } }, [muted])

  const advance = useCallback(() => {
    setIdx(cur => {
      if (cur >= logs.length - 1) { setState('finished'); return cur }
      return cur + 1
    })
  }, [logs.length])

  const onStageDone = useCallback(() => {
    if (stateRef.current === 'playing') advance()
    else pendingAdvance.current = true
  }, [advance])

  const togglePlay = () => {
    if (state === 'playing') { setState('paused'); return }
    setState('playing')
    if (pendingAdvance.current) { pendingAdvance.current = false; advance() }
  }

  const skipToEnd = () => { setIdx(Math.max(0, logs.length - 1)); setState('finished') }
  const replay = () => { pendingAdvance.current = false; setIdx(0); setPhaseMark({ i: 0, p: 'pre' }); setState('playing') }

  if (isLoading) return (
    <div className="space-y-4 pt-4 max-w-5xl mx-auto px-4">
      <Skeleton className="h-44 w-full bg-white/5 rounded-xl" />
      <Skeleton className="h-72 w-full bg-white/5 rounded-xl" />
    </div>
  )
  if (!data?.match) return <div className="text-center mt-10 text-white/50">Maç bulunamadı.</div>

  const match = data.match as { week: number; home_score: number; away_score: number; home_franchise?: { team_name?: string }; away_franchise?: { team_name?: string } }
  const homeName = match.home_franchise?.team_name || 'Ev Sahibi'
  const awayName = match.away_franchise?.team_name || 'Deplasman'
  const live = state === 'playing' || state === 'paused'
  const curLog = logs[idx]

  // skor result fazında güncellenir (banner ile senkron)
  const scoreIdx = phase === 'result' ? idx : idx - 1
  const curScore = state === 'finished'
    ? { h: match.home_score, a: match.away_score }
    : (scoreIdx >= 0 ? scores[scoreIdx] : { h: 0, a: 0 }) || { h: 0, a: 0 }
  const { q, dd } = parseClock(curLog?.time)
  const poss = curLog?.possession
  const feedIdx = phase === 'result' ? idx : idx - 1
  const scoreHot = phase === 'result' && (curLog?.event === 'touchdown' || curLog?.event === 'fg_good' || curLog?.event === 'safety')
  const momentum = momentumAt(logs, Math.max(0, feedIdx))

  /* ---------- MAÇ ÖNCESİ ---------- */
  if (state === 'idle') {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-24">
        <div className="relative rounded-3xl overflow-hidden border border-[#005c99]/50 shadow-[0_0_80px_rgba(0,40,90,0.55)]"
          style={{ backgroundImage: "linear-gradient(180deg,rgba(0,21,43,0.85),rgba(0,12,26,0.96)), url('/stadium_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* projektör süpürmeleri */}
          <motion.div className="absolute -top-1/2 left-1/4 w-40 h-[200%] bg-gradient-to-b from-white/10 to-transparent blur-2xl pointer-events-none"
            animate={{ rotate: [18, -14, 18] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: 'top center' }} />
          <motion.div className="absolute -top-1/2 right-1/4 w-40 h-[200%] bg-gradient-to-b from-accent/10 to-transparent blur-2xl pointer-events-none"
            animate={{ rotate: [-16, 15, -16] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: 'top center' }} />

          <div className="relative p-8 md:p-14 text-center">
            <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-1 mb-10">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-white/70 font-bold uppercase tracking-widest text-xs">Hafta {match.week} · Maç Günü</span>
            </motion.div>

            <div className="flex items-center justify-center gap-3 md:gap-8 mb-4">
              <motion.div initial={{ x: -90, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', damping: 16, delay: 0.15 }}
                className="flex-1 text-right">
                <div className="text-xl md:text-4xl font-display font-black text-white uppercase leading-tight">{homeName}</div>
                <div className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-[#7cc4ff] uppercase mt-1">Ev Sahibi</div>
              </motion.div>
              <motion.div initial={{ scale: 0, rotate: -120 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 11, delay: 0.4 }}
                className="relative bg-[#00254c] border-2 border-accent/50 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(255,156,0,0.3)]">
                <span className="text-accent font-display font-black text-xl md:text-2xl">VS</span>
                <motion.div className="absolute inset-0 rounded-full border-2 border-accent/40"
                  animate={{ scale: [1, 1.35], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
              </motion.div>
              <motion.div initial={{ x: 90, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', damping: 16, delay: 0.15 }}
                className="flex-1 text-left">
                <div className="text-xl md:text-4xl font-display font-black text-white uppercase leading-tight">{awayName}</div>
                <div className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-accent uppercase mt-1">Deplasman</div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-10">
              <button onClick={() => { setIdx(0); setPhaseMark({ i: 0, p: 'pre' }); setState('playing') }}
                disabled={logs.length === 0}
                className="group relative bg-accent hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#001021] text-lg font-display font-black uppercase tracking-widest py-4 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-[0_0_36px_rgba(255,156,0,0.4)]">
                <Play className="w-6 h-6 fill-current" /> MAÇI İZLE
                <motion.span className="absolute inset-0 rounded-xl border-2 border-accent/60 pointer-events-none"
                  animate={{ scale: [1, 1.08], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />
              </button>
              {logs.length === 0 && <p className="text-white/40 text-xs mt-6 uppercase tracking-widest">Bu maç henüz oynanmadı</p>}
              {logs.length > 0 && <p className="text-white/35 text-[11px] mt-5 uppercase tracking-[0.25em]">{logs.length} oyun · canlı yayın kalitesinde</p>}
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* ============ SCOREBUG ============ */}
      <motion.div animate={scoreHot && curLog?.event === 'touchdown' ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.45 }}
        className="sticky top-2 z-30 rounded-2xl overflow-hidden border border-[#005c99] shadow-2xl">
        <div className="relative bg-gradient-to-b from-[#004b93] to-[#001f40] px-4 pt-3 pb-2.5 md:px-5">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1.4px)', backgroundSize: '14px 14px' }} />
          <div className="relative z-10 flex items-center justify-between gap-2">
            {/* ev */}
            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="min-w-0">
                  <div className="text-white font-display font-black text-sm md:text-xl uppercase truncate">{homeName}</div>
                  <div className="h-4">
                    {poss === 'home' && live && (
                      <motion.span layoutId="poss" className="inline-flex items-center gap-1 text-[10px] text-accent font-bold uppercase">🏈 Topta</motion.span>
                    )}
                  </div>
                </div>
                <div className="w-1.5 self-stretch rounded-full bg-[#00a2ff] shrink-0" />
              </div>
            </div>
            {/* skor */}
            <div className="flex items-center gap-2 shrink-0">
              <RollingScore value={curScore.h} hot={scoreHot && poss === 'home'} />
              <span className="text-white/30 font-black">–</span>
              <RollingScore value={curScore.a} hot={scoreHot && poss === 'away'} />
            </div>
            {/* deplasman */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <div className="w-1.5 self-stretch rounded-full bg-accent shrink-0" />
                <div className="min-w-0">
                  <div className="text-white font-display font-black text-sm md:text-xl uppercase truncate">{awayName}</div>
                  <div className="h-4">
                    {poss === 'away' && live && (
                      <motion.span layoutId="poss" className="inline-flex items-center gap-1 text-[10px] text-accent font-bold uppercase">Topta 🏈</motion.span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* durum + momentum */}
          <div className="relative z-10 mt-1.5 space-y-1.5">
            <div className="flex items-center justify-center gap-3">
              {state === 'finished' ? (
                <span className="inline-flex items-center gap-2 bg-[#00254c] border border-white/15 rounded-full px-4 py-1 text-white font-display font-bold uppercase tracking-widest text-xs">
                  <Trophy className="w-4 h-4 text-yellow-400" /> Maç Bitti
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-1 text-white font-display font-bold uppercase tracking-widest text-xs">
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-red-500" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                  <span className="text-accent">{q}</span>{dd && <span className="text-white/60">· {dd}</span>}
                </span>
              )}
            </div>
            {live && <MomentumBar m={momentum} />}
            {live && <QuarterProgress logs={logs} idx={Math.max(0, feedIdx)} />}
          </div>
        </div>

        {/* kontroller */}
        {state !== 'finished' && (
          <div className="bg-[#00152b] border-t border-white/10 px-4 py-2 flex items-center justify-center gap-2.5">
            <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-accent text-black flex items-center justify-center hover:bg-white transition">
              {state === 'playing' ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-1">
              <Zap className="w-3 h-3 text-white/40" />
              {[1, 2, 4].map(sp => (
                <button key={sp} onClick={() => setSpeed(sp)} className={`w-7 h-7 rounded-full text-xs font-bold transition ${speed === sp ? 'bg-accent text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>{sp}x</button>
              ))}
            </div>
            <button onClick={() => setMuted(m => !m)} className="w-9 h-9 rounded-full bg-white/10 text-white/80 flex items-center justify-center hover:bg-white/20 transition" title={muted ? 'Sesi aç' : 'Sesi kapat'}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={skipToEnd} className="w-9 h-9 rounded-full bg-white/10 text-white/80 flex items-center justify-center hover:bg-white/20 transition" title="Sona atla">
              <SkipForward className="w-4 h-4" />
            </button>
            <div className="text-white/30 text-[11px] font-mono ml-1 tabular-nums">{idx + 1}/{logs.length}</div>
          </div>
        )}
      </motion.div>

      {/* ============ SAHNE ============ */}
      {live && curLog && (
        <div className="relative">
          <CinematicStage
            log={curLog} idx={idx} speed={speed} muted={muted}
            homeName={homeName} awayName={awayName}
            onPhase={(p) => setPhaseMark({ i: idx, p })} onDone={onStageDone}
          />
          {/* lower-third anlatım */}
          <AnimatePresence mode="wait">
            {phase === 'result' && curLog.text && (
              <motion.div key={'cap' + idx}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="mt-3 relative overflow-hidden bg-gradient-to-r from-[#00152b] to-[#001a35] border border-white/10 rounded-xl p-3 pl-4">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${poss === 'home' ? 'bg-[#00a2ff]' : 'bg-accent'}`} />
                <p className="text-white/90 text-sm md:text-base leading-snug">{curLog.text}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ============ MAÇ SONU ============ */}
      {state === 'finished' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* final kartı */}
          <div className="relative overflow-hidden rounded-2xl border border-yellow-400/30 bg-gradient-to-b from-[#003a75] to-[#001225] p-6 md:p-10 text-center">
            <FinaleConfetti />
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, delay: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-400/15 border border-yellow-400/40 mb-4">
              <Trophy className="w-7 h-7 text-yellow-400" />
            </motion.div>
            <div className="text-white/50 text-[11px] font-bold tracking-[0.35em] uppercase mb-2">Maç Sonucu</div>
            <div className="flex items-center justify-center gap-4 md:gap-8">
              <div className={`flex-1 text-right font-display font-black uppercase text-lg md:text-3xl ${match.home_score >= match.away_score ? 'text-white' : 'text-white/40'}`}>{homeName}</div>
              <div className="font-display font-black text-4xl md:text-6xl tabular-nums shrink-0">
                <span className={match.home_score >= match.away_score ? 'text-yellow-400' : 'text-white/60'}>{match.home_score}</span>
                <span className="text-white/25 mx-2">–</span>
                <span className={match.away_score >= match.home_score ? 'text-yellow-400' : 'text-white/60'}>{match.away_score}</span>
              </div>
              <div className={`flex-1 text-left font-display font-black uppercase text-lg md:text-3xl ${match.away_score >= match.home_score ? 'text-white' : 'text-white/40'}`}>{awayName}</div>
            </div>
            {logs.length > 0 && (
              <button onClick={replay}
                className="mt-6 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-5 py-2 text-white/85 font-display font-bold uppercase tracking-widest text-xs transition">
                <RotateCcw className="w-4 h-4" /> Tekrar İzle
              </button>
            )}
          </div>

          {logs.length > 0 && (
            <>
              <MomentumChart scores={scores} />
              <StatsPanel logs={logs} homeName={homeName} awayName={awayName} />
              <DrivesPanel drives={drives} homeName={homeName} awayName={awayName} />
            </>
          )}
        </motion.div>
      )}

      {/* ============ CANLI ANLATIM AKIŞI ============ */}
      {live && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Activity className="w-5 h-5 text-accent" />
            <h2 className="text-base font-display font-bold text-white tracking-widest uppercase">Anlatım</h2>
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {feedIdx >= 0 && logs.slice(0, feedIdx + 1).reverse().map((l, i) => {
                const realIdx = feedIdx - i
                const { q: q2, dd: d2 } = parseClock(l.time)
                const hot = !!(l.event && l.event !== 'incomplete' && l.event !== 'penalty')
                return (
                  <motion.div key={realIdx} layout
                    initial={{ opacity: 0, y: -14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                    className={`flex gap-3 p-3 rounded-xl border ${hot ? 'bg-gradient-to-r from-accent/20 to-black/30 border-accent/60' : 'bg-[#00152b] border-white/5'}`}>
                    <div className={`shrink-0 self-start rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${hot ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/50'}`}>{q2 || '•'}{d2 ? ` ${d2}` : ''}</div>
                    <p className={`text-sm ${hot ? 'text-white font-semibold' : 'text-white/75'}`}>{l.text || l.play}</p>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
