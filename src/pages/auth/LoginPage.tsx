import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.')
        setIsLogin(true)
        return
      }
      navigate('/dashboard')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">NFL Manager</h1>
            <p className="text-sm text-gray-400">{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="E-posta"
              className="w-full rounded bg-primary p-2 border border-muted text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              className="w-full rounded bg-primary p-2 border border-muted text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">{isLogin ? 'Giriş' : 'Kayıt Ol'}</Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#001021] px-2 text-white/50">Veya</span>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                await useAuthStore.getState().signInWithGoogle()
              } catch (e: any) {
                alert('Google Giriş Hatası: ' + e.message)
              }
            }}
            className="w-full flex items-center justify-center gap-3 rounded bg-white text-black p-2 font-bold hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Google ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>

          <div className="text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-sm text-accent hover:underline"
            >
              {isLogin ? 'Hesabın yok mu? Kayıt ol.' : 'Zaten hesabın var mı? Giriş yap.'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
