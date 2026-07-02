/* ------------------------------------------------------------------ */
/*  playbook.ts — maç motoru loglarını sinematik sahnelere çevirir     */
/*  Saf mantık: formasyonlar, top yörüngeleri, kamera, event meta      */
/* ------------------------------------------------------------------ */

export interface PlayLog {
  time?: string
  text?: string
  possession?: 'home' | 'away'
  startYard?: number
  endYard?: number
  playType?: string
  event?: string | null
  // legacy engine alanları
  play?: string
  result?: string
}

export type Phase = 'pre' | 'live' | 'result'

/* ----------------------------- saha geometrisi ----------------------------- */
export const FW = 1200 // saha svg genişliği (100u endzone + 1000u saha + 100u endzone)
export const FH = 533

export const isRich = (l: PlayLog | null | undefined): boolean =>
  !!l && !!l.possession && l.startYard !== undefined && l.startYard !== null

export const yardToU = (yard: number, poss: string): number => {
  const u = poss === 'home' ? 100 + yard * 10 : 1100 - yard * 10
  return Math.max(0, Math.min(FW, u))
}
export const uPct = (u: number) => (u / FW) * 100
export const vPct = (v: number) => (v / FH) * 100

/* ----------------------------- saat / skor ----------------------------- */
export const parseClock = (time?: string) => {
  if (!time) return { q: '', dd: '' }
  if (time === 'BAŞLANGIÇ') return { q: 'KICKOFF', dd: '' }
  if (time === 'OT') return { q: 'UZATMA', dd: '' }
  const parts = String(time).split('|').map(s => s.trim())
  return { q: parts[0] || '', dd: parts[1] || '' }
}

export const tdPoints = (text: string) => {
  if (text?.includes('2-POINT BAŞARILI')) return 8
  if (text?.includes('2-POINT BAŞARISIZ') || text?.includes('Ekstra Puan KAÇTI')) return 6
  return 7
}

export function buildScores(logs: PlayLog[]) {
  let h = 0, a = 0
  return logs.map((l) => {
    const t = l.text || ''
    if (l.event === 'touchdown') { const p = tdPoints(t); if (l.possession === 'home') h += p; else a += p }
    else if (l.event === 'fg_good') { if (l.possession === 'home') h += 3; else a += 3 }
    else if (l.event === 'safety') { if (l.possession === 'home') a += 2; else h += 2 }
    return { h, a }
  })
}

export interface Drive {
  possession: string
  plays: PlayLog[]
  startYard: number
  endYard: number
  result: string
}

export function buildDrives(logs: PlayLog[]): Drive[] {
  const drives: Drive[] = []
  let cur: Drive | null = null
  for (const l of logs) {
    if (!isRich(l)) continue
    if (l.playType === 'kickoff') continue
    if (!cur || cur.possession !== l.possession) {
      if (cur) drives.push(cur)
      cur = { possession: l.possession!, plays: [], startYard: l.startYard!, endYard: l.endYard!, result: '—' }
    }
    cur.plays.push(l)
    cur.endYard = l.endYard!
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

/* momentum: son 10 oyunun yarda + event ağırlıklı farkı (-100..100, + = ev sahibi) */
export function momentumAt(logs: PlayLog[], idx: number): number {
  let m = 0
  for (let i = Math.max(0, idx - 9); i <= Math.min(idx, logs.length - 1); i++) {
    const l = logs[i]
    if (!isRich(l)) continue
    const sign = l.possession === 'home' ? 1 : -1
    const gain = Math.max(-15, Math.min(40, (l.endYard ?? 0) - (l.startYard ?? 0)))
    let val = gain
    if (l.event === 'touchdown') val += 55
    else if (l.event === 'fg_good') val += 22
    else if (l.event === 'interception' || l.event === 'fumble' || l.event === 'turnover') val = -50
    else if (l.event === 'safety') val = -35
    else if (l.event === 'sack') val -= 12
    m += sign * val
  }
  return Math.max(-100, Math.min(100, m))
}

/* ----------------------------- deterministik rng ----------------------------- */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ----------------------------- event meta ----------------------------- */
export interface BannerMeta { label: string; sub: string; color: string; glow: string; grad: string }

const PAT_SUB = (text: string) => {
  if (text.includes('2-POINT BAŞARILI')) return '+2 ÇEVİRME BAŞARILI · 8 SAYI'
  if (text.includes('2-POINT BAŞARISIZ')) return 'ÇEVİRME BAŞARISIZ · 6 SAYI'
  if (text.includes('Ekstra Puan KAÇTI')) return 'EKSTRA PUAN KAÇTI · 6 SAYI'
  return 'EKSTRA PUAN İYİ · 7 SAYI'
}

export function bannerFor(log: PlayLog): BannerMeta | null {
  const t = log.text || ''
  switch (log.event) {
    case 'touchdown':
      return { label: 'TOUCHDOWN', sub: PAT_SUB(t), color: '#ffd000', glow: 'rgba(255,208,0,0.65)', grad: 'linear-gradient(100deg,#7a5a00,#ffd000 45%,#fff3b0 50%,#ffd000 55%,#7a5a00)' }
    case 'interception':
      return { label: 'INTERCEPTION', sub: 'TOP EL DEĞİŞTİRDİ', color: '#ff4d4d', glow: 'rgba(255,77,77,0.6)', grad: 'linear-gradient(100deg,#5c0f0f,#ff4d4d 45%,#ffb3b3 50%,#ff4d4d 55%,#5c0f0f)' }
    case 'fumble':
      return { label: 'FUMBLE', sub: 'TOP YERDE — SAVUNMA KAPTI', color: '#ff4d4d', glow: 'rgba(255,77,77,0.6)', grad: 'linear-gradient(100deg,#5c0f0f,#ff4d4d 45%,#ffb3b3 50%,#ff4d4d 55%,#5c0f0f)' }
    case 'sack':
      return { label: 'SACK', sub: 'OYUN KURUCU YIKILDI', color: '#c084fc', glow: 'rgba(192,132,252,0.6)', grad: 'linear-gradient(100deg,#3b0764,#a855f7 45%,#e9d5ff 50%,#a855f7 55%,#3b0764)' }
    case 'fg_good':
      return { label: 'FIELD GOAL', sub: 'DİREKLERİN ARASINDAN · +3', color: '#4ade80', glow: 'rgba(74,222,128,0.6)', grad: 'linear-gradient(100deg,#052e16,#22c55e 45%,#bbf7d0 50%,#22c55e 55%,#052e16)' }
    case 'fg_miss':
      return { label: 'KAÇTI!', sub: 'FIELD GOAL İSABETSİZ', color: '#fda4af', glow: 'rgba(253,164,175,0.5)', grad: 'linear-gradient(100deg,#4c0519,#fb7185 45%,#fecdd3 50%,#fb7185 55%,#4c0519)' }
    case 'safety':
      return { label: 'SAFETY', sub: 'SAVUNMAYA 2 SAYI', color: '#fb923c', glow: 'rgba(251,146,60,0.6)', grad: 'linear-gradient(100deg,#431407,#f97316 45%,#fed7aa 50%,#f97316 55%,#431407)' }
    case 'turnover':
      return { label: 'TOP KAYBI', sub: '4. DOWN ÇEVRİLEMEDİ', color: '#ff4d4d', glow: 'rgba(255,77,77,0.55)', grad: 'linear-gradient(100deg,#5c0f0f,#ef4444 45%,#fecaca 50%,#ef4444 55%,#5c0f0f)' }
    case 'penalty':
      return { label: 'CEZA', sub: t.includes('Face Mask') ? 'FACE MASK · 15 YARDA' : 'HOLDING · 10 YARDA GERİ', color: '#facc15', glow: 'rgba(250,204,21,0.55)', grad: 'linear-gradient(100deg,#422006,#eab308 45%,#fef08a 50%,#eab308 55%,#422006)' }
    default:
      return null
  }
}

/* trait / koç / özel durum çipleri (motorun ruhunu görselleştirir) */
export function extractChips(log: PlayLog): string[] {
  const t = log.text || ''
  const chips: string[] = []
  if (t.includes('BALL HAWK')) chips.push('🦅 BALL HAWK')
  if (t.includes('YAC MACHINE')) chips.push('⚡ YAC MACHINE')
  if (t.includes('ROAD GRADER')) chips.push('🧱 ROAD GRADER')
  if (t.includes('HIT POWER')) chips.push('💥 HIT POWER')
  if (t.includes('POCKET PRESENCE')) chips.push('🧠 POCKET PRESENCE')
  if (t.includes('SIGNATURE PLAY')) chips.push('🚨 SIGNATURE PLAY')
  if (t.includes('Screen pası Blitz')) chips.push('🎯 SCREEN > BLITZ')
  if (t.includes('Play-Action savunmayı kandırdı')) chips.push('🎭 PLAY-ACTION')
  if (t.includes('Dime Savunması ezildi')) chips.push('🔨 DIME EZİLDİ')
  if (t.includes('FIRST DOWN')) chips.push('⛓️ FIRST DOWN')
  return chips
}

export function extractCoachNote(log: PlayLog): string | null {
  const m = (log.text || '').match(/\[((?:Koç|Hücum Koçu|DC)[^\]]+)\]/)
  return m ? m[1] : null
}

/* ----------------------------- sahne tipleri ----------------------------- */
export interface Pt { u: number; v: number }

export interface Sprite {
  id: string
  side: 'off' | 'def'
  label: string
  from: Pt
  to: Pt
  delay: number // s (canlı faz içinde)
  dur: number   // s
}

export interface BallPath {
  u: number[]
  v: number[]
  scale: number[]
  opacity: number[]
  times: number[]
  spin: number // toplam dönüş derecesi
  dur: number  // s (1x hızda)
}

export type SceneKind =
  | 'kickoff' | 'run' | 'short' | 'deep' | 'punt' | 'fg'
  | 'sack' | 'int' | 'fumble' | 'incomplete' | 'penalty' | 'downs' | 'generic'

export interface Scene {
  rich: boolean
  kind: SceneKind
  dir: 1 | -1
  losU: number
  endU: number
  fdU: number | null
  sprites: Sprite[]
  ball: BallPath | null
  cam: { s: number; fromU: number; toU: number }
  banner: BannerMeta | null
  chips: string[]
  coachNote: string | null
  flag: boolean
  impact: Pt | null
  sfx: 'td' | 'roar' | 'groan' | 'whistle' | 'kick' | null
  durs: { pre: number; live: number; result: number } // ms, 1x hız
  gain: number
  downDist: string
  quarterLabel: string
}

/* ----------------------------- kamera ----------------------------- */
function camera(fromU: number, toU: number, arcH: number): Scene['cam'] {
  const span = Math.abs(toU - fromU)
  let s = 2.35 - span / 340
  s = Math.max(1.28, Math.min(2.2, s))
  // yüksek arklı toplarda (derin pas / kick) geniş plan — arkın tepesi kadrajda kalsın
  if (arcH > 0) s = Math.min(s, 236 / (arcH + 60))
  s = Math.max(1.15, s)
  const half = 50 / s
  const clamp = (p: number) => Math.max(half, Math.min(100 - half, p))
  return { s, fromU: clamp(uPct(fromU)), toU: clamp(uPct((fromU + toU) / 2 + (toU - fromU) * 0.35)) }
}

/* ----------------------------- formasyonlar ----------------------------- */
const jitter = (r: () => number, amt: number) => (r() - 0.5) * 2 * amt

function offenseFormation(su: number, dir: number, set: 'pass' | 'run' | 'kick', r: () => number): { pts: { pt: Pt; label: string }[] } {
  const b = (dyU: number, v: number, label: string) => ({ pt: { u: su - dir * dyU, v }, label })
  if (set === 'kick') {
    const line = [200, 222, 244, 266, 288, 310, 332].map(v => b(6, v, 'OL'))
    return { pts: [...line, b(44, 266, 'H'), b(58, 282, 'K'), b(8, 96, 'G'), b(8, 436, 'G')] }
  }
  if (set === 'run') {
    return {
      pts: [
        ...[214, 240, 266, 292, 318].map(v => b(6, v, 'OL')),
        b(20, 266, 'QB'), b(44, 266, 'FB'), b(62, 266, 'RB'),
        b(8, 356, 'TE'), b(10, 96, 'WR'), b(10, 436, 'WR'),
      ],
    }
  }
  return {
    pts: [
      ...[214, 240, 266, 292, 318].map(v => b(6, v, 'OL')),
      b(46, 266, 'QB'), b(52, 300 + jitter(r, 8), 'RB'),
      b(10, 96, 'WR'), b(10, 436, 'WR'), b(16, 156, 'WR'), b(8, 356, 'TE'),
    ],
  }
}

function defenseFormation(su: number, dir: number): { pts: { pt: Pt; label: string }[] } {
  const b = (dyU: number, v: number, label: string) => ({ pt: { u: su + dir * dyU, v }, label })
  return {
    pts: [
      ...[222, 252, 280, 310].map(v => b(9, v, 'DL')),
      ...[196, 266, 336].map(v => b(42, v, 'LB')),
      b(14, 96, 'CB'), b(14, 436, 'CB'),
      b(105, 196, 'S'), b(105, 336, 'S'),
    ],
  }
}

/* ----------------------------- sahne kurucu ----------------------------- */
const LIVE_DUR: Record<SceneKind, number> = {
  kickoff: 1500, run: 1700, short: 1800, deep: 2200, punt: 2100, fg: 2100,
  sack: 1500, int: 2300, fumble: 2000, incomplete: 1600, penalty: 1300, downs: 1400, generic: 1000,
}

export function classify(log: PlayLog): SceneKind {
  if (!isRich(log)) return 'generic'
  if (log.playType === 'kickoff') return 'kickoff'
  if (log.event === 'interception') return 'int'
  if (log.event === 'fumble') return 'fumble'
  if (log.event === 'sack') return 'sack'
  if (log.event === 'penalty') return 'penalty'
  if (log.playType === 'turnover') return 'downs'
  if (log.playType === 'fg') return 'fg'
  if (log.playType === 'punt') return 'punt'
  if (log.event === 'incomplete') return 'incomplete'
  if (log.playType === 'deep_bomb') return 'deep'
  if (log.playType === 'run') return 'run'
  return 'short'
}

export function buildScene(log: PlayLog, idx: number): Scene {
  const rich = isRich(log)
  const { q, dd } = parseClock(log.time)
  const banner = bannerFor(log)
  const chips = extractChips(log)
  const coachNote = extractCoachNote(log)
  const kind = classify(log)
  const r = mulberry32(idx * 2654435761 + 7)

  if (!rich) {
    return {
      rich: false, kind: 'generic', dir: 1, losU: 600, endU: 600, fdU: null,
      sprites: [], ball: null, cam: { s: 1.0, fromU: 50, toU: 50 },
      banner, chips, coachNote, flag: false, impact: null, sfx: banner ? 'roar' : null,
      durs: { pre: 350, live: 900, result: banner ? 1800 : 800 },
      gain: 0, downDist: '', quarterLabel: q,
    }
  }

  const poss = log.possession!
  const dir: 1 | -1 = poss === 'home' ? 1 : -1
  const su = yardToU(log.startYard!, poss)
  const eu = yardToU(log.endYard!, poss)
  const gain = (log.endYard ?? 0) - (log.startYard ?? 0)

  // first down çizgisi
  const distMatch = String(dd).match(/&\s*(\d+)/)
  const distance = distMatch ? parseInt(distMatch[1]) : 10
  const fdYard = Math.min(100, (log.startYard ?? 0) + distance)
  const fdU = (kind === 'fg' || kind === 'punt' || kind === 'kickoff') ? null : yardToU(fdYard, poss)

  const set: 'pass' | 'run' | 'kick' =
    kind === 'fg' || kind === 'punt' ? 'kick'
      : kind === 'run' || kind === 'fumble' ? 'run' : 'pass'

  const off = offenseFormation(su, dir, set, r)
  const def = defenseFormation(su, dir)

  /* --- top yörüngesi + hedef noktalar --- */
  const qbU = su - dir * (set === 'run' ? 20 : 46)
  const midV = 266
  let ball: BallPath | null = null
  let impact: Pt | null = null
  let endV = 190 + r() * 150
  let arcH = 0
  let camTo = eu

  const T = (arr: number[]) => arr // okunabilirlik

  switch (kind) {
    case 'kickoff': {
      const fromU2 = poss === 'home' ? 450 : 750
      const toU2 = poss === 'home' ? 850 : 350
      arcH = 150
      ball = { u: T([fromU2, (fromU2 + toU2) / 2, toU2, toU2, toU2]), v: T([midV, midV - arcH, midV, midV, midV]), scale: [1, 1.7, 1, 1, 1], opacity: [1, 1, 1, 1, 1], times: [0, 0.4, 0.75, 0.9, 1], spin: 720, dur: LIVE_DUR.kickoff / 1000 }
      camTo = toU2
      break
    }
    case 'run': {
      const cutV = midV + (r() > 0.5 ? 1 : -1) * (40 + r() * 60)
      endV = Math.max(60, Math.min(473, cutV + jitter(r, 30)))
      const m1 = su + dir * Math.max(6, Math.abs(eu - su) * 0.35)
      const m2 = su + dir * Math.max(10, Math.abs(eu - su) * 0.7)
      ball = { u: T([qbU, su - dir * 8, m1, m2, eu]), v: T([midV, midV + 14, cutV, endV, endV]), scale: [1, 1, 1.06, 1.06, 1], opacity: [1, 1, 1, 1, 1], times: [0, 0.18, 0.45, 0.75, 1], spin: 200, dur: LIVE_DUR.run / 1000 }
      impact = { u: eu, v: endV }
      break
    }
    case 'short': {
      const catchU = su + dir * Math.max(30, Math.abs(eu - su) * 0.55)
      endV = 150 + r() * 230
      arcH = 55
      ball = { u: T([qbU, qbU - dir * 8, (qbU + catchU) / 2, catchU, eu]), v: T([midV, midV, midV - arcH, endV, endV]), scale: [1, 1, 1.25, 1, 1], opacity: [1, 1, 1, 1, 1], times: [0, 0.2, 0.42, 0.62, 1], spin: 720, dur: LIVE_DUR.short / 1000 }
      impact = { u: eu, v: endV }
      break
    }
    case 'deep': {
      const catchU = su + dir * Math.max(80, Math.abs(eu - su) * 0.85)
      endV = 110 + r() * 120 + (r() > 0.5 ? 180 : 0)
      arcH = 140
      ball = { u: T([qbU, qbU - dir * 14, (qbU + catchU) / 2, catchU, eu]), v: T([midV, midV, midV - arcH, endV, endV]), scale: [1, 1, 1.8, 1.05, 1], opacity: [1, 1, 1, 1, 1], times: [0, 0.22, 0.5, 0.72, 1], spin: 1080, dur: LIVE_DUR.deep / 1000 }
      impact = { u: eu, v: endV }
      break
    }
    case 'incomplete': {
      const tgtU = su + dir * (90 + r() * 140)
      endV = 130 + r() * 270
      arcH = log.playType === 'deep_bomb' ? 130 : 60
      ball = { u: T([qbU, qbU - dir * 10, (qbU + tgtU) / 2, tgtU, tgtU + dir * 14]), v: T([midV, midV, midV - arcH, endV, endV + 16]), scale: [1, 1, 1.5, 1, 0.95], opacity: [1, 1, 1, 1, 0.4], times: [0, 0.22, 0.5, 0.78, 1], spin: 900, dur: LIVE_DUR.incomplete / 1000 }
      impact = { u: tgtU, v: endV }
      camTo = tgtU
      break
    }
    case 'sack': {
      const hitU = eu
      ball = { u: T([qbU, qbU - dir * 22, hitU, hitU, hitU]), v: T([midV, midV, midV + 10, midV + 10, midV + 10]), scale: [1, 1, 0.95, 0.95, 0.95], opacity: [1, 1, 1, 1, 1], times: [0, 0.42, 0.7, 0.85, 1], spin: 40, dur: LIVE_DUR.sack / 1000 }
      impact = { u: hitU, v: midV + 10 }
      endV = midV + 10
      camTo = hitU
      break
    }
    case 'int': {
      const pickU = su + dir * (110 + r() * 160)
      const pickV = 140 + r() * 250
      const retU = pickU - dir * (40 + r() * 60)
      arcH = 110
      ball = { u: T([qbU, (qbU + pickU) / 2, pickU, retU, retU]), v: T([midV, midV - arcH, pickV, pickV + jitter(r, 40), pickV]), scale: [1, 1.6, 1, 1, 1], opacity: [1, 1, 1, 1, 1], times: [0, 0.3, 0.55, 0.85, 1], spin: 900, dur: LIVE_DUR.int / 1000 }
      impact = { u: pickU, v: pickV }
      endV = pickV
      camTo = pickU
      break
    }
    case 'fumble': {
      const dropU = su + dir * Math.max(14, Math.abs(eu - su) * 0.6)
      const dropV = midV + jitter(r, 60)
      ball = { u: T([qbU, su - dir * 8, dropU, dropU + dir * 18, dropU + dir * 6]), v: T([midV, midV + 12, dropV, dropV - 46, dropV + 8]), scale: [1, 1, 1.05, 1.3, 1], opacity: [1, 1, 1, 1, 1], times: [0, 0.25, 0.55, 0.75, 1], spin: 1200, dur: LIVE_DUR.fumble / 1000 }
      impact = { u: dropU, v: dropV }
      endV = dropV
      camTo = dropU
      break
    }
    case 'punt': {
      const landU = Math.max(110, Math.min(1090, su + dir * 400))
      arcH = 165
      const kickU = su - dir * 70
      ball = { u: T([kickU, kickU, (kickU + landU) / 2, landU, landU]), v: T([midV, midV, midV - arcH, midV, midV]), scale: [1, 1, 1.9, 1, 1], opacity: [1, 1, 1, 1, 1], times: [0, 0.18, 0.55, 0.85, 1], spin: 1440, dur: LIVE_DUR.punt / 1000 }
      camTo = landU
      endV = midV
      break
    }
    case 'fg': {
      const good = log.event === 'fg_good'
      const postU = dir === 1 ? 1188 : 12
      endV = good ? 266 : (r() > 0.5 ? 198 : 334)
      arcH = 150
      const kickU2 = su - dir * 70
      ball = { u: T([kickU2, kickU2, (kickU2 + postU) / 2, postU, postU + dir * 6]), v: T([midV, midV, midV - arcH, endV, endV]), scale: [1, 1, 1.85, 1.1, 1], opacity: [1, 1, 1, 1, good ? 0.6 : 1], times: [0, 0.2, 0.55, 0.88, 1], spin: 1080, dur: LIVE_DUR.fg / 1000 }
      camTo = postU - dir * 80
      break
    }
    case 'penalty':
    case 'downs': {
      const shove = su + dir * (kind === 'downs' ? 6 : 12)
      ball = { u: T([qbU, su - dir * 4, shove, shove, shove]), v: T([midV, midV + 10, midV + 16, midV + 16, midV + 16]), scale: [1, 1, 1, 1, 1], opacity: [1, 1, 1, 1, 1], times: [0, 0.35, 0.6, 0.8, 1], spin: 90, dur: LIVE_DUR[kind] / 1000 }
      impact = kind === 'downs' ? { u: shove, v: midV + 16 } : null
      endV = midV + 16
      camTo = su
      break
    }
    default:
      break
  }

  /* --- oyuncu hedefleri --- */
  const liveS = LIVE_DUR[kind] / 1000
  const sprites: Sprite[] = []
  const ballEnd: Pt = ball ? { u: ball.u[ball.u.length - 1], v: ball.v[ball.v.length - 1] } : { u: eu, v: endV }
  const catchPt: Pt = impact || ballEnd

  off.pts.forEach((p, i) => {
    let to: Pt
    const lbl = p.label
    if (lbl === 'OL' || lbl === 'G') {
      to = { u: p.pt.u + dir * (4 + jitter(r, 5)), v: p.pt.v + jitter(r, 10) }
    } else if (lbl === 'QB') {
      to = kind === 'sack' ? { u: ballEnd.u, v: ballEnd.v }
        : set === 'pass' ? { u: p.pt.u - dir * 16, v: p.pt.v + jitter(r, 6) }
          : { u: p.pt.u - dir * 4, v: p.pt.v }
    } else if (lbl === 'RB' || lbl === 'FB') {
      to = set === 'run' && lbl === 'RB' ? { u: ballEnd.u - dir * 6, v: ballEnd.v + jitter(r, 8) }
        : { u: p.pt.u + dir * 24, v: p.pt.v + jitter(r, 30) }
    } else if (lbl === 'WR' || lbl === 'TE') {
      // hedef alıcı: topun düştüğü yere; diğerleri rota koşar
      const isTarget = (kind === 'short' || kind === 'deep' || kind === 'incomplete') &&
        Math.abs(p.pt.v - catchPt.v) === Math.min(...off.pts.filter(x => x.label === 'WR' || x.label === 'TE').map(x => Math.abs(x.pt.v - catchPt.v)))
      to = isTarget ? { u: ballEnd.u + dir * 4, v: ballEnd.v }
        : { u: p.pt.u + dir * (90 + r() * 70), v: p.pt.v + (p.pt.v > midV ? -1 : 1) * r() * 50 }
    } else if (lbl === 'K' || lbl === 'H') {
      to = { u: p.pt.u + dir * (lbl === 'K' ? 14 : 4), v: lbl === 'K' ? 268 : p.pt.v }
    } else {
      to = { u: p.pt.u + dir * 20, v: p.pt.v }
    }
    sprites.push({ id: `o${i}`, side: 'off', label: lbl, from: p.pt, to, delay: 0.06 + r() * 0.1, dur: liveS * 0.82 })
  })

  def.pts.forEach((p, i) => {
    let to: Pt
    if (p.label === 'DL') {
      to = kind === 'sack' ? { u: ballEnd.u + jitter(r, 14), v: ballEnd.v + jitter(r, 18) }
        : set === 'pass' ? { u: qbU + dir * 10 + jitter(r, 10), v: 266 + jitter(r, 34) }
          : { u: catchPt.u + jitter(r, 22), v: catchPt.v + jitter(r, 26) }
    } else {
      // topa yakınsama, kademeli
      to = { u: catchPt.u + jitter(r, 30), v: catchPt.v + jitter(r, 34) }
    }
    const delay = p.label === 'DL' ? 0.05 : p.label === 'LB' ? 0.22 + r() * 0.12 : 0.32 + r() * 0.2
    sprites.push({ id: `d${i}`, side: 'def', label: p.label, from: p.pt, to, delay, dur: liveS * 0.85 })
  })

  const isBig = !!banner
  const sfx: Scene['sfx'] =
    log.event === 'touchdown' ? 'td'
      : log.event === 'fg_good' ? 'kick'
        : log.event === 'penalty' ? 'whistle'
          : (log.event === 'interception' || log.event === 'fumble' || log.event === 'safety' || log.event === 'turnover') ? 'groan'
            : (chips.length > 0 || (gain >= 15)) ? 'roar' : null

  return {
    rich: true, kind, dir, losU: su, endU: eu, fdU,
    sprites, ball,
    cam: camera(su, camTo, arcH),
    banner, chips, coachNote,
    flag: log.event === 'penalty',
    impact,
    sfx,
    durs: {
      pre: kind === 'kickoff' ? 500 : 780,
      live: LIVE_DUR[kind],
      result: isBig ? (log.event === 'touchdown' ? 2600 : 2100) : chips.length ? 1300 : 900,
    },
    gain,
    downDist: dd,
    quarterLabel: q,
  }
}

/* toplam oyun süresi (ms, 1x) — sayfa ilerleme çubuğu için */
export const sceneTotal = (s: Scene) => s.durs.pre + s.durs.live + s.durs.result
