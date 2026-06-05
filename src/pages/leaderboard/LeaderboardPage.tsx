import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy, Star, Target, Crown } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'

export function LeaderboardPage() {
  const { user: currentUser } = useAuthStore()
  const [tab, setTab] = useState<'xp' | 'winrate'>('xp')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('users')
        .select('id, username, manager_xp, total_matches_played, total_matches_won, role')
        .neq('role', 'bot')
      
      if (data) {
        if (tab === 'xp') {
          data.sort((a, b) => (b.manager_xp || 0) - (a.manager_xp || 0))
          setUsers(data)
        } else {
          // Win rate (minimum 5 matches to rank)
          const valid = data.filter(u => (u.total_matches_played || 0) >= 5)
          valid.sort((a, b) => {
            const wrA = (a.total_matches_won || 0) / (a.total_matches_played || 1)
            const wrB = (b.total_matches_won || 0) / (b.total_matches_played || 1)
            return wrB - wrA
          })
          setUsers(valid)
        }
      }
      setLoading(false)
    }
    fetchUsers()
  }, [tab])

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#00152b] border border-[#005c99] rounded-xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" /> KÜRESEL LİDERLİK TABLOSU
          </h1>
          <p className="text-white/60 mt-1 text-sm">Tüm menajerler arasındaki sıralamanı gör.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#00152b] p-1 rounded-xl border border-[#004b93]">
        <button
          onClick={() => setTab('xp')}
          className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${
            tab === 'xp' ? 'bg-accent text-[#001021] shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Star className="w-4 h-4" /> Tecrübe (XP) Liderleri
        </button>
        <button
          onClick={() => setTab('winrate')}
          className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${
            tab === 'winrate' ? 'bg-[#00a2ff] text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target className="w-4 h-4" /> Galibiyet Yüzdesi
        </button>
      </div>

      {/* List */}
      <div className="bg-[#00152b] border border-[#005c99] rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#00254c] border-b border-[#004b93] text-white/50 text-xs uppercase tracking-widest font-bold">
              <th className="p-4 w-16 text-center">#</th>
              <th className="p-4">Menajer</th>
              <th className="p-4 text-center">Oynanan Maç</th>
              <th className="p-4 text-center">
                {tab === 'xp' ? 'Seviye (XP)' : 'Kazanma %'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-white">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-white/50">Yükleniyor...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-white/50">{tab === 'winrate' ? 'Sıralamaya girmek için en az 5 resmi maç yapılmalıdır.' : 'Kimse bulunamadı.'}</td></tr>
            ) : (
              <>
                {users.slice(0, 20).map((u, i) => {
                  const wr = u.total_matches_played > 0 
                    ? Math.round((u.total_matches_won / u.total_matches_played) * 100) 
                    : 0
                  const level = Math.floor((u.manager_xp || 0) / 100) + 1
                  const isMe = currentUser?.id === u.id

                  return (
                    <tr key={i} className={`transition-colors ${isMe ? 'bg-accent/20 border-l-4 border-accent' : 'hover:bg-white/5'}`}>
                      <td className="p-4 text-center font-black text-lg">
                        {i === 0 ? <Crown className="w-6 h-6 text-yellow-500 mx-auto drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]" /> :
                         i === 1 ? <span className="text-gray-400">2</span> :
                         i === 2 ? <span className="text-amber-700">3</span> :
                         <span className="text-white/40">{i + 1}</span>}
                      </td>
                      <td className="p-4 font-bold uppercase tracking-wider text-base">
                        {u.username}
                        {u.role === 'admin' && <span className="ml-2 text-[9px] bg-red-600 px-1.5 py-0.5 rounded text-white">ADMIN</span>}
                        {isMe && <span className="ml-2 text-[9px] bg-accent text-[#001021] px-1.5 py-0.5 rounded font-bold">SEN</span>}
                      </td>
                      <td className="p-4 text-center font-bold text-white/70">
                        {u.total_matches_played || 0}
                      </td>
                      <td className="p-4 text-center">
                        {tab === 'xp' ? (
                          <div className="flex flex-col items-center">
                            <span className="text-accent font-black text-lg">LVL {level}</span>
                            <span className="text-[10px] text-white/40">{u.manager_xp || 0} XP</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-[#00a2ff] font-black text-lg">%{wr}</span>
                            <span className="text-[10px] text-white/40">{u.total_matches_won} G - {u.total_matches_played - u.total_matches_won} M</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {/* Check if current user is outside top 20 */}
                {currentUser && users.findIndex(u => u.id === currentUser.id) >= 20 && (
                  <>
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-white/30 text-xs tracking-widest bg-[#00152b]">
                        •••
                      </td>
                    </tr>
                    {(() => {
                      const myIndex = users.findIndex(u => u.id === currentUser.id);
                      const myRank = myIndex + 1;
                      const u = users[myIndex];
                      if (!u) return null;
                      
                      const wr = u.total_matches_played > 0 
                        ? Math.round((u.total_matches_won / u.total_matches_played) * 100) 
                        : 0
                      const level = Math.floor((u.manager_xp || 0) / 100) + 1

                      return (
                        <tr className="bg-accent/20 border-t-2 border-accent/50 sticky bottom-0 backdrop-blur-md">
                          <td className="p-4 text-center font-black text-lg text-white/80">
                            {myRank}
                          </td>
                          <td className="p-4 font-bold uppercase tracking-wider text-base">
                            {u.username}
                            <span className="ml-2 text-[9px] bg-accent text-[#001021] px-1.5 py-0.5 rounded font-bold">SEN</span>
                          </td>
                          <td className="p-4 text-center font-bold text-white/70">
                            {u.total_matches_played || 0}
                          </td>
                          <td className="p-4 text-center">
                            {tab === 'xp' ? (
                              <div className="flex flex-col items-center">
                                <span className="text-accent font-black text-lg">LVL {level}</span>
                                <span className="text-[10px] text-white/40">{u.manager_xp || 0} XP</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="text-[#00a2ff] font-black text-lg">%{wr}</span>
                                <span className="text-[10px] text-white/40">{u.total_matches_won} G - {u.total_matches_played - u.total_matches_won} M</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })()}
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
