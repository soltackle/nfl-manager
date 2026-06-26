import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, RefreshCw } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  time: string
  type: 'transfer' | 'injury' | 'rumor' | 'match'
}

const MOCK_NEWS: NewsItem[] = [
  { id: '1', title: 'Büyük Takas: Yıldız QB yeni takımına katıldı.', time: '2 saat önce', type: 'transfer' },
  { id: '2', title: 'Haftanın oyuncusu belli oldu: 3 Touchdown, sıfır hata!', time: '5 saat önce', type: 'match' },
  { id: '3', title: 'Savunma hattında büyük sakatlık! En az 3 hafta yok.', time: '1 gün önce', type: 'injury' },
  { id: '4', title: 'Draft söylentileri: Hangi takım kimi seçecek?', time: '1 gün önce', type: 'rumor' },
  { id: '5', title: 'Market hareketli: Maaş bütçesi dolan takımlar oyuncularını satıyor.', time: '2 gün önce', type: 'transfer' }
]

export function LeagueNews() {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS)

  // Just to show some random changing behavior
  useEffect(() => {
    const interval = setInterval(() => {
      setNews(prev => {
        const newNews = [...prev]
        const last = newNews.pop()
        if (last) newNews.unshift(last)
        return newNews
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-[#00152b] border border-[#005c99]/30 rounded-xl p-4 h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-white uppercase tracking-wider text-sm">Lig Haberleri</h3>
        </div>
        <RefreshCw className="w-4 h-4 text-white/30 cursor-pointer hover:text-white transition-colors" onClick={() => setNews([...news].reverse())} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
        <AnimatePresence>
          {news.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group cursor-pointer"
            >
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  item.type === 'transfer' ? 'bg-blue-400' :
                  item.type === 'injury' ? 'bg-red-400' :
                  item.type === 'match' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <div>
                  <div className="text-sm text-white/90 font-medium leading-snug group-hover:text-accent transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-wider">
                    {item.time}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
