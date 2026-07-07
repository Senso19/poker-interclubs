import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ProtectedRoute from '../components/ProtectedRoute'
import { getSuit } from '../components/ClubCard'

function AdminPanelInner() {
  const [tab, setTab] = useState('tournaments')

  return (
    <div>
      <h1 className="font-display text-3xl text-white mb-1">Administration</h1>
      <p className="text-white/70 mb-6">Réservé à l'administrateur principal.</p>

      <div className="flex gap-1 border-b border-white/15 mb-8">
        {[
          ['tournaments', 'Tournois & lieux'],
          ['players', 'Joueurs'],
          ['admins', "Comptes admin"],
          ['blindvalet', 'BlindValet'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-mono border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-gold-400 text-white'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'tournaments' && <TournamentsTab />}
      {tab === 'players' && <PlayersTab />}
      {tab === 'admins' && <AdminsTab />}
      {tab === 'blindvalet' && <BlindValetTab />}
    </div>
  )
}

function TournamentsTab() {
  const [tournaments, setTournaments] = useState([])
  const [form, setForm] = useState({ name: '', date: '', location: '', status: 'a_venir' })
  const [editingId, setEditingId] = useState(null)

  async function refresh() {
    const { data } = await supabase.from('tournaments').select('*').order('date')
    setTournaments(data ?? [])
  }
  useEffect(() => {
    refresh()
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!form.name || !form.date) return
    if (editingId) {
      await supabase.from('tournaments').update(form).eq('id', editingId)
    } else {
      await supabase.from('tournaments').insert(form)
    }
    setForm({ name: '', date: '', location: '', status: 'a_venir' })
    setEditingId(null)
    refresh()
  }

  function edit(t) {
    setForm({ name: t.name, date: t.date, location: t.location ?? '', status: t.status })
    setEditingId(t.id)
  }

  async function remove(id) {
    await supabase.from('tournaments').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={submit} className="bg-ink-800 border border-ink-600 rounded-xl p-5 space-y-3 h-fit">
        <h2 className="font-display text-lg text-parchment-100 mb-1">
          {editingId ? 'Modifier une étape' : 'Nouvelle étape'}
        </h2>
        <Field label="Nom de l'étape">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Étape 3 — Brive"
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Lieu">
          <input
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Salle des fêtes, Brive-la-Gaillarde"
          />
        </Field>
        <Field label="Statut">
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="a_venir">À venir</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </Field>
        <div className="flex gap-2 pt-1">
          <button type="submit" className="btn-gold">
            {editingId ? 'Enregistrer' : 'Créer'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm({ name: '', date: '', location: '', status: 'a_venir' })
              }}
              className="btn-outline"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {tournaments.map((t) => (
          <div key={t.id} className="bg-ink-800 border border-ink-600 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-parchment-100 font-medium">{t.name}</div>
              <div className="text-xs font-mono text-parchment-600">
                {new Date(t.date).toLocaleDateString('fr-FR')} · {t.location} ·{' '}
                <StatusBadge status={t.status} />
              </div>
            </div>
            <div className="flex gap-2 text-xs font-mono">
              <button onClick={() => edit(t)} className="text-parchment-400 hover:text-gold-500">
                modifier
              </button>
              <button onClick={() => remove(t.id)} className="text-parchment-400 hover:text-card-red">
                supprimer
              </button>
            </div>
          </div>
        ))}
        {tournaments.length === 0 && <p className="text-parchment-600 text-sm">Aucune étape créée.</p>}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    a_venir: ['À venir', 'text-gold-500'],
    en_cours: ['En cours', 'text-felt-500'],
    termine: ['Terminé', 'text-parchment-600'],
  }
  const [label, cls] = map[status] ?? [status, 'text-parchment-600']
  return <span className={cls}>{label}</span>
}

function PlayersTab() {
  const [clubs, setClubs] = useState([])
  const [players, setPlayers] = useState([])
  const [form, setForm] = useState({ name: '', pseudo: '', club_id: '' })
  const [error, setError] = useState('')

  async function refresh() {
    const { data: c } = await supabase.from('clubs').select('*').order('name')
    const { data: p } = await supabase.from('players').select('*, clubs(name, slug)').order('name')
    setClubs(c ?? [])
    setPlayers(p ?? [])
    if (c?.length && !form.club_id) setForm((f) => ({ ...f, club_id: c[0].id }))
  }
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addPlayer(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.club_id) return
    const { error } = await supabase
      .from('players')
      .insert({ name: form.name.trim(), pseudo: form.pseudo.trim() || null, club_id: form.club_id })
    if (error) {
      setError(error.message)
      return
    }
    setForm({ ...form, name: '', pseudo: '' })
    refresh()
  }

  async function removePlayer(id) {
    await supabase.from('players').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={addPlayer} className="bg-ink-800 border border-ink-600 rounded-xl p-5 space-y-3 h-fit">
        <h2 className="font-display text-lg text-parchment-100 mb-1">Ajouter un joueur</h2>
        <Field label="Nom">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Pseudo (optionnel)">
          <input
            className="input"
            value={form.pseudo}
            onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
          />
        </Field>
        <Field label="Club">
          <select
            className="input"
            value={form.club_id}
            onChange={(e) => setForm({ ...form, club_id: e.target.value })}
          >
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className="btn-gold">
          Ajouter
        </button>
        {error && <p className="text-card-red text-xs">{error}</p>}
      </form>

      <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
        {clubs.map((club, i) => {
          const suit = getSuit(club.slug, i)
          const clubPlayers = players.filter((p) => p.club_id === club.id)
          return (
            <div key={club.id} className="bg-ink-800 border border-ink-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {club.logo_url ? (
                  <img src={club.logo_url} alt={`Logo ${club.name}`} className="w-5 h-5 object-contain rounded bg-white p-0.5" />
                ) : (
                  <span className={`font-mono text-xs ${suit.color}`}>{suit.symbol}</span>
                )}
                <span className="font-mono text-xs text-parchment-400">
                  {club.name} ({clubPlayers.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {clubPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="text-xs font-mono text-parchment-400 bg-ink-700/60 border border-ink-700 rounded-full pl-3 pr-1 py-1 flex items-center gap-2"
                  >
                    {p.name}
                    <button onClick={() => removePlayer(p.id)} className="text-parchment-600 hover:text-card-red">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AdminsTab() {
  const [admins, setAdmins] = useState([])
  const [clubs, setClubs] = useState([])
  const [form, setForm] = useState({ username: '', password: '', role: 'secondary', club_id: '' })

  async function refresh() {
    const { data: a } = await supabase.from('admins').select('*, clubs(name)').order('role')
    const { data: c } = await supabase.from('clubs').select('*').order('name')
    setAdmins(a ?? [])
    setClubs(c ?? [])
    if (c?.length && !form.club_id) setForm((f) => ({ ...f, club_id: c[0].id }))
  }
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addAdmin(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) return
    await supabase.from('admins').insert({
      username: form.username.trim(),
      password: form.password.trim(),
      role: form.role,
      club_id: form.role === 'main' ? null : form.club_id,
    })
    setForm({ ...form, username: '', password: '' })
    refresh()
  }

  async function removeAdmin(id) {
    await supabase.from('admins').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={addAdmin} className="bg-ink-800 border border-ink-600 rounded-xl p-5 space-y-3 h-fit">
        <h2 className="font-display text-lg text-parchment-100 mb-1">Créer un compte</h2>
        <Field label="Identifiant">
          <input
            className="input"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </Field>
        <Field label="Mot de passe">
          <input
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Field label="Rôle">
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="secondary">Administrateur de club</option>
            <option value="main">Administrateur principal</option>
          </select>
        </Field>
        {form.role === 'secondary' && (
          <Field label="Club rattaché">
            <select
              className="input"
              value={form.club_id}
              onChange={(e) => setForm({ ...form, club_id: e.target.value })}
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <button type="submit" className="btn-gold">
          Créer le compte
        </button>
        <p className="text-xs text-parchment-600 pt-1">
          Les mots de passe sont stockés simplement (sans hachage), adapté à un usage interne entre clubs.
        </p>
      </form>

      <div className="space-y-2">
        {admins.map((a) => (
          <div key={a.id} className="bg-ink-800 border border-ink-600 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-parchment-100 text-sm font-medium">{a.username}</div>
              <div className="text-xs font-mono text-parchment-600">
                {a.role === 'main' ? 'Administrateur principal' : a.clubs?.name ?? '—'}
              </div>
            </div>
            <button onClick={() => removeAdmin(a.id)} className="text-xs font-mono text-parchment-400 hover:text-card-red">
              supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function BlindValetTab() {
  return (
    <div className="bg-ink-800 border border-ink-600 rounded-xl p-8 max-w-2xl">
      <h2 className="font-display text-xl text-parchment-100 mb-2">Intégration BlindValet</h2>
      <span className="inline-block text-xs font-mono text-gold-500 border border-gold-600/50 rounded-full px-2 py-0.5 mb-4">
        Prévu en V2
      </span>
      <p className="text-parchment-400 text-sm leading-relaxed">
        Cette section accueillera l'inscription automatique des joueurs qualifiés vers BlindValet, ainsi que la
        gestion des tables et des sièges, une fois la base commune de tournois et de joueurs stabilisée. Elle
        s'appuiera sur la même logique d'interception déjà utilisée pour vos extensions Chrome DIX'9 (BlindValet
        troll / overlay prizepool).
      </p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono text-parchment-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

export default function AdminPanel() {
  return (
    <ProtectedRoute requireMain>
      <AdminPanelInner />
    </ProtectedRoute>
  )
}
