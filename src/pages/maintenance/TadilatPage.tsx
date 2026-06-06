import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Wrench, Shield, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

const PROGRESS = 78

export function TadilatPage() {
  const navigate = useNavigate()
  const { user, profile, signIn, signInWithGoogle, signOut, isLoading } = useAuthStore()
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (isLoading || !user || !profile) return

    if (isAdmin) {
      navigate('/admin', { replace: true })
      return
    }

    signOut()
    setLoginError('Bu hesap yönetici değil. Site tadilatta, sadece admin girişi yapılabilir.')
  }, [user, profile, isAdmin, isLoading, navigate, signOut])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data } = await supabase.from('users').select('role').eq('id', authUser.id).maybeSingle()
      if (data?.role !== 'admin') {
        await signOut()
        setLoginError('Bu hesap yönetici değil. Sadece admin hesapları giriş yapabilir.')
        return
      }
      navigate('/admin', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Giriş başarısız'
      setLoginError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-[#001021]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00a2ff]/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md text-center"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-[#00a2ff]/20 border border-accent/30 mb-6 shadow-[0_0_40px_rgba(255,156,0,0.15)]"
        >
          <Wrench className="w-10 h-10 text-accent" />
        </motion.div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="font-display text-3xl md:text-4xl font-black italic tracking-tighter text-white">
            AMFUT
          </span>
          <span className="font-display text-3xl md:text-4xl font-black text-accent">MANAGER</span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Tadilat Modu Aktif
        </div>

        <div className="bg-[#00152b]/90 backdrop-blur-sm rounded-2xl p-8 border border-[#005c99]/60 shadow-2xl text-left">
          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-4 text-center">
            Stadyum Hazırlanıyor
          </h1>

          <p className="text-white text-base leading-relaxed mb-8 text-center">
            Sitemiz şu anda tadilat çalışması nedeniyle geçici olarak kapalıdır.
            Çok yakında yeni özelliklerle geri döneceğiz!
          </p>

          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-3">
              <span className="text-white">Geliştirme</span>
              <span className="text-accent">%{PROGRESS}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-[#ffb732] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${PROGRESS}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          <a
            href="https://instagram.com/redisethut"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all shadow-lg mb-6"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Instagram @redisethut sayfasını takip ediniz
          </a>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">
              {loginError}
            </div>
          )}

          {!showLogin ? (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors border-t border-white/10 pt-6"
            >
              <Shield className="w-4 h-4" />
              Yönetici Girişi
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-white/10 pt-6 space-y-4"
              >
                <p className="text-center text-white text-xs font-bold uppercase tracking-widest">
                  Sadece Admin Hesapları
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    setLoginError(null)
                    try {
                      await signInWithGoogle(`${window.location.origin}/tadilat`)
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : 'Google giriş hatası'
                      setLoginError(msg)
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-black p-3 font-bold hover:bg-gray-100 transition-colors text-sm"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google ile Giriş
                </button>

                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      placeholder="Admin e-posta"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-accent/50"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      placeholder="Şifre"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-accent/50"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full osm-button py-3">
                    {isSubmitting ? 'Giriş yapılıyor...' : 'Admin Girişi'}
                  </Button>
                </form>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mt-6">
          2026 AMFUT Manager
        </p>
      </motion.div>
    </div>
  )
}
