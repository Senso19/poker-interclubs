import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { getSuit } from '../components/ClubCard'

export default function PublicView() {
  const [tournaments, setTournaments] = useState([])
  const [clubs, setClubs] = useState([])
  const [registrationsByTournament, setRegistrationsByTournament] = useState({})
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('tournaments').select('*').order('date', { ascending: false })
      const { data: c } = await supabase.from('clubs').select('*').order('name')
      setTournaments(t ?? [])
      setClubs(c ?? [])
    }
    load()
  }, [])

  useEffect(() => {
    async function loadRegs() {
      if (!openId || registrationsByTournament[openId]) return
      const { data } = await supabase
        .from('registrations')
        .select('*, players(name, club_id), clubs(name, slug)')
        .eq('tournament_id', openId)
      setRegistrationsByTournament((prev) => ({ ...prev, [openId]: data ?? [] }))
    }
    loadRegs()
  }, [openId, registrationsByTournament])

  return (
    <div>
      <h1 className="font-display text-3xl text-white mb-1">Tournois & joueurs</h1>
      <p className="text-white/70 mb-8">Vue publique, accessible à tous — sans connexion.</p>

      <div className="space-y-3">
        {tournaments.map((t) => {
          const isOpen = openId === t.id
          const regs = registrationsByTournament[t.id] ?? []
          const byClub = clubs.map((club, i) => ({
            club,
            suit: getSuit(club.slug, i),
            players: regs.filter((r) => r.club_id === club.id),
          }))

          return (
            <div key={t.id} className="bg-ink-800 border border-ink-600 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : t.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-ink-700/50 transition-colors"
              >
                <div>
                  <div className="font-display text-lg text-parchment-100">{t.name}</div>
                  <div className="text-xs font-mono text-parchment-600">
                    {new Date(t.date).toLocaleDateString('fr-FR')} · {t.location}
                  </div>
                </div>
                <StatusPill status={t.status} />
              </button>

              {isOpen && (
                <div className="border-t border-ink-700 px-5 py-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {byClub.map(({ club, suit, players }) => (
                    <div key={club.id}>
                      <div className="flex items-center gap-2 mb-2">
                        {club.logo_url ? (
                          <img
                            src={club.logo_url}
                            alt={`Logo ${club.name}`}
                            className="w-5 h-5 object-contain rounded bg-white p-0.5"
                          />
                        ) : (
                          <span className={`font-mono text-xs ${suit.color}`}>{suit.symbol}</span>
                        )}
                        <span className="font-mono text-xs text-parchment-100">{club.name}</span>
                      </div>
                      {players.length === 0 ? (
                        <p className="text-xs text-parchment-600 italic">Aucun joueur inscrit</p>
                      ) : (
                        <ul className="space-y-1">
                          {players.map((r) => (
                            <li key={r.player_id} className="text-sm text-parchment-300">
                              {r.players?.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {tournaments.length === 0 && <p className="text-parchment-600 text-sm">Aucun tournoi pour le moment.</p>}
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    a_venir: ['À venir', 'border-gold-600/60 text-gold-500'],
    en_cours: ['En cours', 'border-felt-500/60 text-felt-500'],
    termine: ['Terminé', 'border-ink-600 text-parchment-600'],
  }
  const [label, cls] = map[status] ?? [status, 'border-ink-600 text-parchment-600']
  return <span className={`text-xs font-mono border rounded-full px-2 py-0.5 ${cls}`}>{label}</span>
}
