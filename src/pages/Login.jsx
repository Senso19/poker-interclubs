import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await login(username.trim(), password)
    setBusy(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    navigate('/clubs')
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-10">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#2F63EB] to-[#1D3E9E] flex items-center justify-center font-display text-3xl text-white shadow-lg shadow-black/30">
          ♠
        </div>
        <div className="font-display text-4xl text-white tracking-wide">
          TOURNOIS INTERCLUB
        </div>
        <div className="text-xs uppercase tracking-widest text-white/50 mt-2">SAISON 2026 - 2027</div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl p-7 shadow-2xl shadow-black/30"
      >
        <h1 className="font-display text-xl text-parchment-100 mb-1 text-center">Connexion</h1>
        <p className="text-xs text-parchment-600 mb-6 text-center">
          Réservé aux administrateurs de club et à l'administrateur principal.
        </p>

        <label className="field-label">Identifiant</label>
        <input
          className="input mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="field-label">Mot de passe</label>
        <input
          type="password"
          className="input mb-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="text-card-red text-sm mt-2">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn-gold mt-5 w-full py-2.5 flex items-center justify-center gap-2"
        >
          {busy ? 'Connexion…' : 'Se connecter →'}
        </button>
      </form>

      <div className="flex gap-6 text-sm">
        <Link to="/public" className="text-white/70 hover:text-white transition-colors">
          Voir les tournois →
        </Link>
        <Link to="/rankings" className="text-white/70 hover:text-white transition-colors">
          Voir les classements →
        </Link>
      </div>
    </div>
  )
}
