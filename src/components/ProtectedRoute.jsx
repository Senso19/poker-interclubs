import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

// requireMain: réservé à l'administrateur principal
// requireClub: si fourni, l'admin secondaire doit être rattaché à ce club_id (l'admin principal passe toujours)
export default function ProtectedRoute({ children, requireMain = false, requireClubId = null }) {
  const { session, loading, isMainAdmin } = useAuth()

  if (loading) return null
  if (!session) return <Navigate to="/" replace />
  if (requireMain && !isMainAdmin) return <Navigate to="/clubs" replace />
  if (requireClubId && !isMainAdmin && session.clubId !== requireClubId) {
    return <Navigate to="/clubs" replace />
  }
  return children
}
