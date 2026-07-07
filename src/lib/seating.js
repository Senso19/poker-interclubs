// Tirage équilibré des tables : répartit les joueurs inscrits sur un nombre
// fixe de tables, en respectant un maximum de joueurs par club à chaque table.
// Avec 4 clubs et une limite de 2 joueurs/club/table, une table de 8 est
// toujours réalisable (4 clubs x 2 = 8), donc l'algorithme réussit toujours
// tant qu'aucun club n'a plus de (tableCount x maxPerClub) joueurs inscrits.

function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// players: [{ playerId, clubId, name, ... }]
// Retourne un tableau de `tableCount` tables, chacune étant une liste de joueurs
// (avec un `seatNumber` 1..tableSize attribué aléatoirement dans la table).
export function drawTables(players, { tableCount = 5, tableSize = 8, maxPerClub = 2 } = {}) {
  const tables = Array.from({ length: tableCount }, () => [])

  const byClub = new Map()
  for (const p of players) {
    if (!byClub.has(p.clubId)) byClub.set(p.clubId, [])
    byClub.get(p.clubId).push(p)
  }

  for (const [, clubPlayers] of byClub) {
    const pool = shuffle(clubPlayers)
    const tableOrder = shuffle(Array.from({ length: tableCount }, (_, i) => i))
    let cursor = 0

    for (const player of pool) {
      let placed = false
      for (let attempt = 0; attempt < tableCount; attempt++) {
        const tIdx = tableOrder[cursor % tableCount]
        cursor++
        const table = tables[tIdx]
        const countForClub = table.filter((p) => p.clubId === player.clubId).length
        if (table.length < tableSize && countForClub < maxPerClub) {
          table.push(player)
          placed = true
          break
        }
      }
      if (!placed) {
        // Ne devrait arriver que si un club dépasse tableCount x maxPerClub inscrits.
        const fallback = tables.find((t) => t.length < tableSize)
        if (fallback) fallback.push({ ...player, constraintViolated: true })
      }
    }
  }

  // Attribution aléatoire des numéros de siège à l'intérieur de chaque table.
  return tables.map((table) => {
    const seats = shuffle(Array.from({ length: tableSize }, (_, i) => i + 1))
    return table.map((p, i) => ({ ...p, seatNumber: seats[i] }))
  })
}
