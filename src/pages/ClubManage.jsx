import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ProtectedRoute from '../components/ProtectedRoute'
import { getSuit } from '../components/ClubCard'

const SLOTS = 10

function ClubManageInner() {
  const { slug } = useParams()
  const [club, setClub] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [clubPlayers, setClubPlayers] = useState([])
  const [registrations, setRegistrations] = useState([]) // player_id per slot, index-aligned
  const [newPlayer, setNewPlayer] = useState({ name: '', pseudo: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function loadPlayers(clubId) {
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .order('name')

    const { data: regsData } = await supabase
      .from('registrations')
      .select('player_id, tournaments(status)')
      .eq('club_id', clubId)

    const participations = {}
    for (const r of regsData ?? []) {
      if (r.tournaments?.status === 'termine') {
        participations[r.player_id] = (participations[r.player_id] ?? 0) + 1
      }
    }

    setClubPlayers(
      (playersData ?? []).map((p) => ({ ...p, participations: participations[p.id] ?? 0 }))
    )
  }

  useEffect(() => {
    async function load() {
      const { data: clubData } = await supabase.from('clubs').select('*').eq('slug', slug).maybeSingle()
      setClub(clubData)
      if (!clubData) return

      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['a_venir', 'en_cours'])
        .order('date', { ascending: true })
      setTournaments(tournamentsData ?? [])
      if (tournamentsData?.length) setSelectedTournamentId(tournamentsData[0].id)

      await loadPlayers(clubData.id)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useEffect(() => {
    async function loadRegistrations() {
      if (!selectedTournamentId || !club) return
      const { data } = await supabase
        .from('registrations')
        .select('player_id')
        .eq('tournament_id', selectedTournamentId)
        .eq('club_id', club.id)
      const ids = (data ?? []).map((r) => r.player_id)
      const padded = [...ids, ...Array(SLOTS - ids.length).fill('')]
      setRegistrations(padded.slice(0, SLOTS))
    }
    loadRegistrations()
  }, [selectedTournamentId, club])

  const suit = useMemo(() => (club ? getSuit(club.slug) : { symbol: '♠', color: 'suit-black' }), [club])
  const filledCount = registrations.filter(Boolean).length

  function setSlot(index, playerId) {
    setRegistrations((prev) => {
      const next = [...prev]
      next[index] = playerId
      return next
    })
  }

  async function addPlayer() {
    const pseudo = newPlayer.pseudo.trim()
    if (!pseudo || !club) return
    const { error } = await supabase
      .from('players')
      .insert({ pseudo, name: newPlayer.name.trim() || pseudo, club_id: club.id })
    if (error) {
      setMessage("Erreur lors de l'ajout du joueur : " + error.message)
      return
    }
    setNewPlayer({ name: '', pseudo: '' })
    loadPlayers(club.id)
  }

  async function removePlayer(playerId) {
    if (!window.confirm('Supprimer ce joueur du club ? Il sera aussi retiré des inscriptions en cours.')) return
    await supabase.from('players').delete().eq('id', playerId)
    setRegistrations((prev) => prev.map((id) => (id === playerId ? '' : id)))
    loadPlayers(club.id)
  }

  async function saveRegistrations() {
    if (!selectedTournamentId || !club) return
    setSaving(true)
    setMessage('')

    const playerIds = registrations.filter(Boolean)
    const duplicates = playerIds.length !== new Set(playerIds).size
    if (duplicates) {
      setMessage('Un même joueur est sélectionné plusieurs fois.')
      setSaving(false)
      return
    }

    await supabase
      .from('registrations')
      .delete()
      .eq('tournament_id', selectedTournamentId)
      .eq('club_id', club.id)

    if (playerIds.length) {
      const rows = playerIds.map((player_id) => ({
        tournament_id: selectedTournamentId,
        club_id: club.id,
        player_id,
      }))
      const { error } = await supabase.from('registrations').insert(rows)
      if (error) {
        setMessage("Erreur lors de l'enregistrement : " + error.message)
        setSaving(false)
        return
      }
    }
    setMessage('Inscriptions enregistrées.')
    setSaving(false)
  }

  if (!club) return <p className="text-white/70 font-mono text-sm">Chargement du club…</p>

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        {club.logo_url ? (
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg shadow-black/20">
            <img src={club.logo_url} alt={`Logo ${club.name}`} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <span className={`font-display text-3xl ${suit.color}`}>{suit.symbol}</span>
        )}
        <h1 className="font-display text-3xl text-white">{club.name}</h1>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-8 shadow-xl shadow-black/20">
        <label className="field-label">Tournoi à venir</label>
        {tournaments.length === 0 ? (
          <p className="text-parchment-600 text-sm">
            Aucun tournoi programmé pour l'instant. L'administrateur principal doit d'abord en créer un.
          </p>
        ) : (
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="input max-w-md"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {new Date(t.date).toLocaleDateString('fr-FR')} — {t.location}
              </option>
            ))}
          </select>
        )}

        {selectedTournamentId && (
          <>
            <div className="mt-6 mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-parchment-100">
                Inscriptions <span className="font-mono text-sm text-parchment-600">({filledCount}/{SLOTS})</span>
              </h2>
              <button onClick={saveRegistrations} disabled={saving} className="btn-gold">
                {saving ? 'Enregistrement…' : 'Enregistrer les 10 joueurs'}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {Array.from({ length: SLOTS }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 bg-ink-700/40 border border-ink-700 rounded-lg px-3 py-2">
                  <span className="font-mono text-xs text-parchment-600 w-6">{String(i + 1).padStart(2, '0')}</span>
                  <select
                    value={registrations[i] ?? ''}
                    onChange={(e) => setSlot(i, e.target.value)}
                    className="flex-1 bg-transparent text-parchment-100 outline-none py-1"
                  >
                    <option value="">— siège libre —</option>
                    {clubPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.pseudo || p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {message && <p className="text-gold-500 text-sm">{message}</p>}
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-xl shadow-black/20">
        <h2 className="font-display text-lg text-parchment-100 mb-4">Effectif du club</h2>

        <div className="flex flex-wrap gap-2 mb-6">
          <input
            value={newPlayer.pseudo}
            onChange={(e) => setNewPlayer({ ...newPlayer, pseudo: e.target.value })}
            placeholder="Pseudo"
            className="input flex-1 min-w-[10rem] max-w-xs"
          />
          <input
            value={newPlayer.name}
            onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
            placeholder="Nom - Prénom (optionnel)"
            className="input flex-1 min-w-[10rem] max-w-xs"
          />
          <button onClick={addPlayer} className="btn-outline">
            Ajouter un joueur
          </button>
        </div>

        {message && <p className="text-card-red text-sm mb-4">{message}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-parchment-600 border-b border-ink-700">
                <th className="pb-2 pr-4 font-semibold">Pseudo</th>
                <th className="pb-2 pr-4 font-semibold">Nom - Prénom</th>
                <th className="pb-2 pr-4 font-semibold">Participations</th>
                <th className="pb-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {clubPlayers.map((p) => (
                <tr key={p.id} className="border-b border-ink-700/60 last:border-0">
                  <td className="py-2.5 pr-4 text-parchment-100">{p.pseudo || p.name}</td>
                  <td className="py-2.5 pr-4 text-parchment-400 font-mono text-xs">{p.name || '—'}</td>
                  <td className="py-2.5 pr-4 font-mono text-gold-500">{p.participations}</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => removePlayer(p.id)}
                      className="text-xs font-mono text-parchment-400 hover:text-card-red transition-colors"
                    >
                      supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {clubPlayers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-parchment-600 italic">
                    Aucun joueur pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function ClubManage() {
  const { slug } = useParams()
  return (
    <ProtectedRouteBySlug slug={slug}>
      <ClubManageInner />
    </ProtectedRouteBySlug>
  )
}

// Résout le club_id à partir du slug avant d'appliquer la protection de route,
// car ProtectedRoute compare des club_id (UUID), pas des slugs.
function ProtectedRouteBySlug({ slug, children }) {
  const [clubId, setClubId] = useState(undefined) // undefined = en cours, null = introuvable

  useEffect(() => {
    supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => setClubId(data?.id ?? null))
  }, [slug])

  if (clubId === undefined) return null
  return <ProtectedRoute requireClubId={clubId}>{children}</ProtectedRoute>
}
