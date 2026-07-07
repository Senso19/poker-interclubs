// Barème par défaut : dégressif par place, + un bonus fixe par élimination (KO).
// Modifiable ensuite depuis la page Classements par l'administrateur principal,
// et stocké dans la table `points_formula` (une seule ligne, colonne `config` en jsonb).
export const DEFAULT_FORMULA = {
  positions: [
    { position: 1, points: 20 },
    { position: 2, points: 16 },
    { position: 3, points: 14 },
    { position: 4, points: 12 },
    { position: 5, points: 10 },
    { position: 6, points: 8 },
    { position: 7, points: 6 },
    { position: 8, points: 4 },
    { position: 9, points: 2 },
    { position: 10, points: 1 },
    ...Array.from({ length: 30 }, (_, i) => ({ position: i + 11, points: 0 })),
  ],
  pointsParKO: 1,
  koExponent: 1, // 1 = linéaire (points x KO). >1 = progression exponentielle (chaque KO supplémentaire rapporte plus que le précédent).
  pointsParticipation: 0, // bonus fixe pour toute personne classée, même hors barème
}

// Garantit que le barème couvre bien les 40 positions (1 à 40), même si une
// configuration plus ancienne n'en avait que 10 : complète avec 0 point.
export function normalizeFormula(formula, maxPosition = 40) {
  const byPosition = new Map((formula.positions ?? []).map((p) => [p.position, p.points]))
  const positions = Array.from({ length: maxPosition }, (_, i) => {
    const position = i + 1
    return { position, points: byPosition.get(position) ?? 0 }
  })
  return { ...formula, positions }
}

// Calcule les points d'un joueur pour une étape donnée.
export function computePoints(position, koCount, formula = DEFAULT_FORMULA) {
  const ko = Number(koCount) || 0
  const exponent = formula.koExponent ?? 1
  const koPart = ko > 0 ? (formula.pointsParKO ?? 0) * Math.pow(ko, exponent) : 0
  const entry = formula.positions.find((p) => p.position === Number(position))
  const positionPart = entry ? entry.points : (formula.pointsParticipation ?? 0)
  return Math.round((positionPart + koPart) * 10) / 10
}

// Agrège les résultats de toutes les étapes en classement individuel et classement club.
export function buildRankings(results, players, formula = DEFAULT_FORMULA) {
  const playerById = new Map(players.map((p) => [p.id, p]))
  const individuals = new Map() // player_id -> { player, totalPoints, stages }
  const clubs = new Map() // club_id -> { totalPoints, stages: Set }

  for (const r of results) {
    const player = playerById.get(r.player_id)
    if (!player) continue
    const pts = computePoints(r.position, r.ko_count, formula)

    if (!individuals.has(r.player_id)) {
      individuals.set(r.player_id, { player, totalPoints: 0, stageCount: 0 })
    }
    const ind = individuals.get(r.player_id)
    ind.totalPoints += pts
    ind.stageCount += 1

    if (!clubs.has(player.club_id)) {
      clubs.set(player.club_id, { clubId: player.club_id, totalPoints: 0 })
    }
    clubs.get(player.club_id).totalPoints += pts
  }

  const individualRanking = [...individuals.values()].sort((a, b) => b.totalPoints - a.totalPoints)
  const clubRanking = [...clubs.values()].sort((a, b) => b.totalPoints - a.totalPoints)

  return { individualRanking, clubRanking }
}
