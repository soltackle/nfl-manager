import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '../layout/Layout'

const DEFAULT_TIPS = [
  "Pas ağırlıklı bir oyun için iyi bir Quarterback'e (QB) ve kaliteli Wide Receiver'lara (WR) ihtiyacınız var.",
  "Koşu oyunu, özellikle maçın son anlarında süreyi eritmek için mükemmel bir taktiktir.",
  "Defansif hat (DL) oyuncularınız ne kadar güçlüyse, rakip oyun kurucuya o kadar fazla baskı yaparsınız.",
  "Offensive Line (OL) oyuncularını ihmal etmeyin. Onlar olmadan takımınız hiçbir şey yapamaz.",
  "Maaş bütçenizi dikkatli kullanın. Sadece yıldızlara para harcamak, yedek kulübesini zayıflatır.",
  "Tesisleri geliştirmek (Training), uzun vadede oyuncu gelişimini hızlandırır.",
  "Draft seçimlerinde en yüksek OVR yerine, takımın sistemine en uygun olanı seçmek önemlidir.",
  "Market'te sürekli fırsat kollayın. Genç ve potansiyelli oyuncular ileride takımın temel taşı olabilir."
]

const DEFAULT_MESSAGES = [
  "Maç sahası yükleniyor...",
  "Oyuncular yükleniyor...",
  "Taktikler analiz ediliyor...",
  "Stadyum hazırlanıyor...",
  "Scout raporları bekleniyor..."
]

interface LoadingScreenProps {
  title?: string;
  messages?: string[];
  tips?: string[];
  withLayout?: boolean;
}

export function LoadingScreen({
  title = "Yükleniyor...",
  messages = DEFAULT_MESSAGES,
  tips = DEFAULT_TIPS,
  withLayout = true
}: LoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * tips.length))

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 2000)

    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length)
    }, 5000)

    return () => {
      clearInterval(messageInterval)
      clearInterval(tipInterval)
    }
  }, [messages.length, tips.length])

  const content = (
    <div className="flex flex-col items-center justify-center min-h-[60vh] h-full relative p-6 w-full">
      {/* Loading Spinner & Title */}
      <div className="text-center mb-16">
        <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-4">{title}</h2>
        <div className="h-8 relative overflow-hidden flex justify-center w-full max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-slate-400 font-medium absolute text-center w-full"
            >
              {messages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Random Tips */}
      <div className="absolute bottom-10 left-0 right-0 px-6 max-w-2xl mx-auto text-center">
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">💡 Menajer İpucu</div>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="text-slate-300 text-sm md:text-base font-medium"
            >
              "{tips[tipIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )

  if (withLayout) {
    return (
      <Layout>
        {content}
      </Layout>
    )
  }

  return (
    <div className="min-h-screen bg-[#001021] text-white flex items-center justify-center w-full relative">
      {content}
    </div>
  )
}
