import { useRoster } from '@/hooks/useRoster'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export function RosterPage() {
  const { roster, isLoading } = useRoster()

  if (isLoading) return <Skeleton className="h-[400px] w-full" />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kadro</h1>
      <div className="grid gap-3">
        {roster.map(player => (
          <Card key={player.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{player.name}</div>
                <div className="text-sm text-gray-400">Değer: ${player.value.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={player.position as any}>{player.position}</Badge>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-lg font-bold border border-accent">
                  {player.overall}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {roster.length === 0 && <p className="text-gray-400">Kadronuzda oyuncu bulunmuyor.</p>}
      </div>
    </div>
  )
}
