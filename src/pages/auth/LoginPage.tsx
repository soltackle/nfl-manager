import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
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
            <p className="text-sm text-gray-400">Giriş Yap</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
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
            <Button type="submit" className="w-full">Giriş</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
