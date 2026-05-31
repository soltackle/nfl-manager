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
