import { useState, useEffect } from 'react'
import { useTactics } from '@/hooks/useTactics'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiFetch } from '@/lib/api'

export function TacticsPage() {
  const { tactics, isLoading, mutate } = useTactics()
  const [sliders, setSliders] = useState({
    pass_ratio: 50,
    aggression: 50,
    tempo: 50,
    defense_line: 50
  })

  useEffect(() => {
    if (tactics?.slider_ayarlari) {
      setSliders(tactics.slider_ayarlari)
    }
  }, [tactics])

  if (isLoading) return <Skeleton className="h-[400px] w-full" />

  const handleSave = async () => {
    await apiFetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/tactics', {
      method: 'PATCH',
      body: JSON.stringify({ slider_ayarlari: sliders })
    })
    mutate()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Taktikler</h1>
      <p className="text-sm text-gray-400">Maç öncesi oyun planınızı belirleyin.</p>
      
      <Card>
        <CardContent className="space-y-6 p-6">
          {Object.entries(sliders).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{key.replace('_', ' ')}</span>
                <span className="font-bold text-accent">{value}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={value}
                onChange={(e) => setSliders({...sliders, [key]: parseInt(e.target.value)})}
                className="w-full accent-accent"
              />
            </div>
          ))}
          <Button onClick={handleSave} className="w-full mt-4">Kaydet</Button>
        </CardContent>
      </Card>
      {/* STUB: Paket seçimi */}
    </div>
  )
}
