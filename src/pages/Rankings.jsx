import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../lib/AuthContext'
import { getSuit } from '../components/ClubCard'
import { computePoints, buildRankings, DEFAULT_FORMULA } from '../lib/points'

export default function Rankings() {
  const { isMainAdmin } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [players, setPlayers] = useState([])
  const [clubs, setClubs] = useState([])
  const [results, setResults] = useState([])
  const [formula, setFormula] = useState(DEFAULT_FORMULA)
  const [activeTournamentId, setActiveTournamentId] = useState(null)
  const [showFormulaEditor, setShowFormulaEditor] = useState(false)

  async function loadAll() {
    const { data: t } = await supabase.from('tournaments').select('*').order('date')
    const { data: p } = await supabase.from('players').select('*')
    const { data: c } = await supabase.from('clubs').select('*').order('name')
    const { data: r } = await supabase.from('results').select('*')
    const { data: f } = await supabase.from('points_formula').select('config').maybeSingle()

    setTournaments(t ?? [])
    setPlayers(p ?? [])
    setClubs(c ?? [])
    setResults(r ?? [])
    if (f?.config) setFormula(f.config)
    if (t?.length && !activeTournamentId) setActiveTournamentId(t[t.length - 1].id)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { individualRanking, clubRanking } = useMemo(
    () => buildRankings(results, players, formula),
    [results, players, formula]
  )

  const clubById = useMemo(() => new Map(clubs.map((c, i) => [c.id, { ...c, suit: getSuit(c.slug, i) }])), [clubs])

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Classements</h1>
          <p className="text-white/70">Cumul des points sur l'ensemble des étapes disputées.</p>
        </div>
        {isMainAdmin && (
          <button onClick={() => setShowFormulaEditor((v) => !v)} className="btn-outline">
            {showFormulaEditor ? 'Fermer le barème' : 'Modifier le barème de points'}
          </button>
        )}
      </div>

      {isMainAdmin && showFormulaEditor && (
        <FormulaEditor formula={formula} onSaved={(f) => setFormula(f)} />
      )}

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <RankingTable title="Classement individuel" rows={individualRanking.map((r, i) => ({
          rank: i + 1,
          label: r.player.name,
          sub: clubById.get(r.player.club_id)?.name,
          suit: clubById.get(r.player.club_id)?.suit,
          points: r.totalPoints,
        }))} />
        <RankingTable title="Classement club" rows={clubRanking.map((r, i) => ({
          rank: i + 1,
          label: clubById.get(r.clubId)?.name ?? '—',
          suit: clubById.get(r.clubId)?.suit,
          points: r.totalPoints,
        }))} />
      </div>

      {isMainAdmin && (
        <div>
          <h2 className="font-display text-xl text-white mb-4">Saisie des résultats par étape</h2>
          <div className="flex gap-2 flex-wrap mb-5">
            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTournamentId(t.id)}
                className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
                  activeTournamentId === t.id
                    ? 'bg-gradient-to-r from-[#142B57] to-[#2F63EB] border-transparent text-white'
                    : 'border-white/30 text-white/70 hover:border-white/60 hover:text-white bg-white/5'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {activeTournamentId && (
            <StageResultsEditor
              tournamentId={activeTournamentId}
              players={players}
              formula={formula}
              existingResults={results.filter((r) => r.tournament_id === activeTournamentId)}
              onSaved={loadAll}
            />
          )}
        </div>
      )}
    </div>
  )
}

function RankingTable({ title, rows }) {
  return (
    <div className="bg-ink-800 border border-ink-600 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-ink-700">
        <h3 className="font-display text-lg text-parchment-100">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-5 py-4 text-parchment-600 italic">Pas encore de résultats.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.rank} className="border-b border-ink-700/60 last:border-0">
              <td className="px-5 py-2.5 font-mono text-parchment-600 w-10">{row.rank}</td>
              <td className="px-2 py-2.5">
                <div className="text-parchment-100">{row.label}</div>
                {row.sub && (
                  <div className={`text-xs font-mono ${row.suit?.color ?? 'text-parchment-600'}`}>
                    {row.suit?.symbol} {row.sub}
                  </div>
                )}
              </td>
              <td className="px-5 py-2.5 font-mono text-gold-500 text-right">{row.points} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StageResultsEditor({ tournamentId, players, formula, existingResults, onSaved }) {
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const byPosition = new Map(existingResults.map((r) => [r.position, r]))
    const initial = Array.from({ length: 10 }, (_, i) => {
      const pos = i + 1
      const existing = byPosition.get(pos)
      return {
        position: pos,
        playerId: existing?.player_id ?? '',
        koCount: existing?.ko_count ?? 0,
      }
    })
    setRows(initial)
  }, [tournamentId, existingResults])

  function updateRow(index, patch) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  async function save() {
    setSaving(true)
    await supabase.from('results').delete().eq('tournament_id', tournamentId)
    const toInsert = rows
      .filter((r) => r.playerId)
      .map((r) => ({
        tournament_id: tournamentId,
        player_id: r.playerId,
        position: r.position,
        ko_count: Number(r.koCount) || 0,
      }))
    if (toInsert.length) await supabase.from('results').insert(toInsert)
    setSaving(false)
    onSaved?.()
  }

  return (
    <div className="bg-ink-800 border border-ink-600 rounded-xl p-5">
      <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-3 text-xs font-mono text-parchment-600 px-1 mb-2">
        <span>#</span>
        <span>Joueur</span>
        <span>KO</span>
        <span className="text-right">Points</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={row.position} className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-3 items-center">
            <span className="font-mono text-parchment-400">{row.position}</span>
            <select
              className="input py-1.5"
              value={row.playerId}
              onChange={(e) => updateRow(i, { playerId: e.target.value })}
            >
              <option value="">—</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              className="input py-1.5"
              value={row.koCount}
              onChange={(e) => updateRow(i, { koCount: e.target.value })}
            />
            <span className="font-mono text-gold-500 text-right">
              {row.playerId ? computePoints(row.position, row.koCount, formula) : '—'}
            </span>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="btn-gold mt-4">
        {saving ? 'Enregistrement…' : 'Enregistrer les résultats de l\'étape'}
      </button>
    </div>
  )
}

function FormulaEditor({ formula, onSaved }) {
  const [local, setLocal] = useState(formula)
  const [saving, setSaving] = useState(false)

  function updatePosition(position, points) {
    setLocal((prev) => ({
      ...prev,
      positions: prev.positions.map((p) => (p.position === position ? { ...p, points: Number(points) } : p)),
    }))
  }

  async function save() {
    setSaving(true)
    await supabase.from('points_formula').upsert({ id: '00000000-0000-0000-0000-000000000001', config: local })
    setSaving(false)
    onSaved?.(local)
  }

  return (
    <div className="bg-ink-800 border border-gold-600/40 rounded-xl p-5 mb-8">
      <h3 className="font-display text-lg text-parchment-100 mb-4">Barème de points</h3>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-5">
        {local.positions.map((p) => (
          <label key={p.position} className="text-center">
            <span className="block text-xs font-mono text-parchment-600 mb-1">{p.position}ᵉ</span>
            <input
              type="number"
              className="input py-1.5 text-center"
              value={p.points}
              onChange={(e) => updatePosition(p.position, e.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="flex items-end gap-4 flex-wrap">
        <label>
          <span className="block text-xs font-mono text-parchment-600 mb-1">Points par élimination (KO)</span>
          <input
            type="number"
            className="input py-1.5 w-40"
            value={local.pointsParKO}
            onChange={(e) => setLocal({ ...local, pointsParKO: Number(e.target.value) })}
          />
        </label>
        <label>
          <span className="block text-xs font-mono text-parchment-600 mb-1">
            Exposant KO <span className="text-parchment-400">(1 = linéaire)</span>
          </span>
          <input
            type="number"
            step="0.1"
            min="1"
            className="input py-1.5 w-40"
            value={local.koExponent ?? 1}
            onChange={(e) => setLocal({ ...local, koExponent: Number(e.target.value) })}
          />
        </label>
        <button onClick={save} disabled={saving} className="btn-gold">
          {saving ? 'Enregistrement…' : 'Enregistrer le barème'}
        </button>
      </div>

      <p className="text-xs font-mono text-parchment-600 mt-4">
        Aperçu : 3 KO → {computePoints(99, 3, { ...local, positions: [], pointsParticipation: 0 })} pts · 5 KO →{' '}
        {computePoints(99, 5, { ...local, positions: [], pointsParticipation: 0 })} pts · 8 KO →{' '}
        {computePoints(99, 8, { ...local, positions: [], pointsParticipation: 0 })} pts
      </p>
    </div>
  )
}
