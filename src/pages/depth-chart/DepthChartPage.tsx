import { useDepthChart } from '@/hooks/useDepthChart'
import { useRoster } from '@/hooks/useRoster'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export function DepthChartPage() {
  const { depthChart, isLoading: isDcLoading } = useDepthChart()
  const { roster, isLoading: isRosterLoading } = useRoster()

  if (isDcLoading || isRosterLoading) return <Skeleton className="h-[400px] w-full" />

  // STUB: Sürükle bırak ile oyuncu yerleştirme mantığı tam eklenecek
  // Şimdilik sadece listeleme
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Derinlik Tablosu (Depth Chart)</h1>
      <p className="text-sm text-gray-400">Oyuncuları sürükleyerek sahaya yerleştirin.</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <h2 className="font-semibold text-accent">Saha (Starter)</h2>
          {depthChart?.map(dc => {
            const p = roster.find(r => r.id === dc.player_id)
            return (
              <Card key={dc.id} className="p-3">
                <div className="flex justify-between items-center">
                  <Badge variant={dc.position as any}>{dc.position}</Badge>
                  <span className="text-sm">{p?.name || 'Boş'} ({p?.overall || '-'})</span>
                </div>
              </Card>
            )
          })}
        </div>
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-400">Bench (Yedekler)</h2>
          {roster.filter(r => !depthChart?.some(dc => dc.player_id === r.id)).map(player => (
            <Card key={player.id} className="p-3 opacity-75">
              <div className="flex justify-between items-center">
                <Badge variant={player.position as any}>{player.position}</Badge>
                <span className="text-sm">{player.name} ({player.overall})</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
