import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useFranchiseStore } from '../../store/franchiseStore'
import type { LeagueChat as ChatType } from '../../types'
import { Send, AlertCircle, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export function LeagueChat() {
  const { league, franchise } = useFranchiseStore()
  const [messages, setMessages] = useState<ChatType[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [cooldown, setCooldown] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!league) return
    
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('league_chat')
        .select('*, franchises(team_name)')
        .eq('league_id', league.id)
        .order('created_at', { ascending: true })
        .limit(50)
      
      if (!error && data) {
        setMessages(data)
      }
      setLoading(false)
      scrollToBottom()
    }
    
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase.channel(`league_chat_${league.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'league_chat',
        filter: `league_id=eq.${league.id}`
      }, async (payload) => {
        // Fetch the sender's team name if it's not a system message
        let newMsg = payload.new as ChatType
        if (!newMsg.is_system && newMsg.franchise_id) {
           const { data } = await supabase.from('franchises').select('team_name').eq('id', newMsg.franchise_id).single()
           newMsg = { ...newMsg, franchises: data } as any
        }
        setMessages(prev => [...prev, newMsg])
        scrollToBottom()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [league])

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !league || !franchise || cooldown > 0) return

    const msg = newMessage.trim()
    setNewMessage('')
    setCooldown(60) // 60 seconds cooldown

    await supabase.from('league_chat').insert({
      league_id: league.id,
      franchise_id: franchise.id,
      message: msg,
      is_system: false
    })
  }

  if (loading) return <div className="h-[400px] flex items-center justify-center text-white/50">Sohbet Yükleniyor...</div>

  return (
    <div className="flex flex-col h-[400px] bg-[#001021]/80 rounded-xl border border-[#005c99]/50 overflow-hidden shadow-2xl relative backdrop-blur-md">
      
      {/* Header */}
      <div className="bg-[#00254c] border-b border-[#005c99] px-4 py-3 flex items-center justify-between z-10">
        <h3 className="text-white font-display font-bold uppercase tracking-widest text-sm flex items-center gap-2">
          Lig Sohbeti
        </h3>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-white/40 text-xs mt-10 uppercase tracking-widest">
            Sohbete ilk mesajı sen yaz!
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isMe = msg.franchise_id === franchise?.id
          
          if (msg.is_system) {
            return (
              <div key={msg.id || idx} className="flex flex-col items-center my-4">
                <div className="bg-red-600/20 border border-red-500 text-red-100 text-xs px-4 py-2 rounded-lg flex items-center gap-2 max-w-[90%] shadow-lg shadow-red-500/10">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-bold tracking-wide">{msg.message}</span>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`text-[10px] text-white/40 mb-1 flex items-center gap-1 font-bold tracking-wider ${isMe ? 'flex-row-reverse' : ''}`}>
                <Shield className="w-3 h-3 text-accent" />
                {(msg as any).franchises?.team_name || 'Bilinmeyen'} 
                <span className="text-white/20 mx-1">•</span>
                {format(new Date(msg.created_at), 'HH:mm', { locale: tr })}
              </div>
              <div className={`px-4 py-2 rounded-xl text-sm max-w-[85%] ${
                isMe 
                  ? 'bg-[#004b93] text-white border border-[#005c99]' 
                  : 'bg-white/5 text-white/90 border border-white/10'
              }`}>
                {msg.message}
              </div>
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-[#00152b] border-t border-[#005c99]/50 p-3 z-10 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={cooldown > 0}
          placeholder={cooldown > 0 ? `Lütfen ${cooldown} saniye bekleyin...` : "Lige mesaj gönder..."}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim() || cooldown > 0}
          className="bg-accent hover:bg-yellow-400 text-[#001021] p-2 px-4 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
