import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Layout({ children }) {
  const { session, logout, isMainAdmin } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/clubs" className="flex items-baseline gap-2 group">
            <span className="font-display text-xl tracking-wide text-white">
              Accueil
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <NavLink to="/public">Tournois</NavLink>
            <NavLink to="/rankings">Classements</NavLink>
            {isMainAdmin && <NavLink to="/admin">Administration</NavLink>}
            {session ? (
              <button
                onClick={handleLogout}
                className="ml-1 px-3 py-1.5 rounded-full border border-white/25 text-white/70 hover:border-red-300 hover:text-red-300 transition-colors font-mono text-xs"
              >
                Déconnexion
              </button>
            ) : (
              <NavLink to="/">Connexion</NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-8">{children}</main>

      <footer className="py-4 text-center text-xs font-mono text-white/50">
        Interclubs Poker — HPCL · 19PokerClub · OPC · Les Lottois
      </footer>
    </div>
  )
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
    >
      {children}
    </Link>
  )
}
