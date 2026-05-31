import { useState } from 'react'
import { useMarket } from '@/hooks/useMarket'
import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiFetch } from '@/lib/api'

export function MarketPage() {
  const { freeAgents, isLoading, mutate } = useMarket()
  const { franchise, setFranchise } = useFranchiseStore()
  const [buyingId, setBuyingId] = useState<string | null>(null)

  if (isLoading) return <Skeleton className="h-[400px] w-full" />

  const handleBuy = async (playerId: string, cost: number) => {
    if (!franchise || franchise.club_fund < cost) return alert('Yetersiz bütçe')
    setBuyingId(playerId)
    try {
      const res = await apiFetch<{success: boolean, error?: string}>(
        import.meta.env.VITE_SUPABASE_URL + '/functions/v1/market-buy',
        {
          method: 'POST',
          body: JSON.stringify({ player_id: playerId })
        }
      )
      if (res.success) {
        setFranchise({ ...franchise, club_fund: franchise.club_fund - cost })
        mutate()
      } else {
        alert('Hata: ' + res.error)
      }
    } catch (e: any) {
      alert('Hata: ' + e.message)
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Serbest Oyuncular (FA Market)</h1>
      <p className="text-sm text-gray-400">Bütçe: ${franchise?.club_fund.toLocaleString()}</p>
      
      <div className="grid gap-3">
        {freeAgents.map(player => (
          <Card key={player.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{player.name}</div>
                <div className="text-accent font-bold">${player.value.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={player.position as any}>{player.position}</Badge>
                <div className="text-xl font-bold">{player.overall}</div>
                <Button 
                  size="sm" 
                  onClick={() => handleBuy(player.id, player.value)}
                  disabled={buyingId === player.id || (franchise?.club_fund || 0) < player.value}
                >
                  {buyingId === player.id ? '...' : 'Al'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {freeAgents.length === 0 && <p className="text-gray-400">Pazarda şu an oyuncu yok.</p>}
      </div>
    </div>
  )
}
