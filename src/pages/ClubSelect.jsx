import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ClubCard from '../components/ClubCard'
import { useAuth } from '../lib/AuthContext'

export default function ClubSelect() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const { session } = useAuth()

  useEffect(() => {
    let active = true
    supabase
      .from('clubs')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (active) {
          setClubs(data ?? [])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Vos clubs</h1>
        <p className="text-white/70 mt-1">
          {session?.role === 'main'
            ? "En tant qu'administrateur principal, vous pouvez gérer les quatre clubs."
            : "Accédez à la page de gestion de votre club pour inscrire vos joueurs."}
        </p>
      </div>

      {loading ? (
        <p className="text-white/70 font-mono text-sm">Chargement…</p>
      ) : clubs.length === 0 ? (
        <p className="text-white/70">
          Aucun club enregistré. Ajoutez HPCL, 19PokerClub, OPC et Les Lottois dans Supabase (voir README).
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-3xl">
          {clubs.map((club, i) => (
            <ClubCard key={club.id} club={club} index={i} to={`/club/${club.slug}`} />
          ))}
        </div>
      )}
    </div>
  )
}
