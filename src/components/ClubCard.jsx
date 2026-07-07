import { Link } from 'react-router-dom'

// Chaque club a une enseigne fixe, comme aux cartes : deux rouges, deux noires.
// C'est la signature visuelle du site — l'enseigne identifie le club partout.
const SUITS = {
  hpcl: { symbol: '♠', color: 'suit-black' },
  '19pokerclub': { symbol: '♥', color: 'suit-red' },
  opc: { symbol: '♦', color: 'suit-red' },
  'les-lottois': { symbol: '♣', color: 'suit-black' },
}
const FALLBACK_SUITS = ['♠', '♥', '♦', '♣']

export function getSuit(slug, index = 0) {
  return SUITS[slug] ?? { symbol: FALLBACK_SUITS[index % 4], color: index % 2 === 0 ? 'suit-black' : 'suit-red' }
}

export default function ClubCard({ club, index, to }) {
  const suit = getSuit(club.slug, index)
  return (
    <Link
      to={to}
      className="group relative block rounded-2xl border border-white/10 bg-white p-6 aspect-[3/5]
                 hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 shadow-xl shadow-black/30"
    >
      <div className={`absolute top-4 left-4 font-display text-2xl leading-none ${suit.color}`}>
        {suit.symbol}
        <div className="text-xs font-mono text-parchment-600 mt-0.5">{club.name.slice(0, 3).toUpperCase()}</div>
      </div>
      <div className={`absolute bottom-4 right-4 font-display text-2xl leading-none rotate-180 ${suit.color}`}>
        {suit.symbol}
        <div className="text-xs font-mono text-parchment-600 mt-0.5">{club.name.slice(0, 3).toUpperCase()}</div>
      </div>

      <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
        {club.logo_url ? (
          <div className="w-full h-28 rounded-xl bg-white flex items-center justify-center p-2 shadow-inner">
            <img
              src={club.logo_url}
              alt={`Logo ${club.name}`}
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>
        ) : (
          <div className={`w-24 h-24 rounded-full bg-ink-700/50 flex items-center justify-center font-display text-4xl ${suit.color}`}>
            {suit.symbol}
          </div>
        )}
        <div>
          <div className="font-display text-xl text-parchment-100">{club.name}</div>
          <div className="text-xs font-mono text-parchment-600 mt-1 group-hover:text-gold-500 transition-colors">
            Gérer le club →
          </div>
        </div>
      </div>
    </Link>
  )
}
