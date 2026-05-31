import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function MatchResultPage() {
  const { id } = useParams()
  const { data: result, isLoading } = useSWR(
    id ? (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + `/functions/v1/matches-result?id=${id}` : null,
    apiFetch
  )

  if (isLoading) return <Skeleton className="h-[400px] w-full" />
  
  const match = (result as any)?.data
  const logs = match?.logs?.[0]?.plays || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Maç Sonucu</h1>
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="text-center font-bold text-xl">{match?.home_score}</div>
          <div className="text-sm text-gray-400">Maç Bitti</div>
          <div className="text-center font-bold text-xl">{match?.away_score}</div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="mb-3 font-semibold">Play-by-play (Özet)</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {logs.map((log: any, i: number) => (
            <div key={i} className="text-sm p-2 bg-surface rounded-md border border-muted">
              <span className="font-bold text-accent mr-2">Drive {log.drive} ({log.team})</span>
              <span>{log.play} - {log.result}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
