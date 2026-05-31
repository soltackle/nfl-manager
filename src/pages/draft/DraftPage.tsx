// STUB: Draft Page
import { useDraft } from '@/hooks/useDraft'
import { Skeleton } from '@/components/ui/Skeleton'

export function DraftPage() {
  const { draftSession, isLoading } = useDraft()

  if (isLoading) return <Skeleton className="h-[400px] w-full" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-accent animate-pulse">Draft Odası</h1>
      <p>Şu anki Tur: {draftSession?.current_round}</p>
      {/* Draft mantığı */}
    </div>
  )
}
