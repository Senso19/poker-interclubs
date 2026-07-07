// Relais serveur vers la Cloud Function BlindValet "tournamentOp" (op: movePlayer),
// pour placer un joueur invité à une table et un siège précis.

const BLINDVALET_URL = 'https://us-central1-blindvalet-production.cloudfunctions.net/tournamentOp'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'method_not_allowed' })
  }

  const { token, tournId, pseudo, table, seat } = req.body || {}
  if (!token || !tournId || !pseudo || !table || !seat) {
    return res.status(400).json({ ok: false, reason: 'missing_params' })
  }

  try {
    const bvRes = await fetch(BLINDVALET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Origin: 'https://app.blindvalet.com',
        Referer: 'https://app.blindvalet.com/',
      },
      body: JSON.stringify({
        data: {
          tournID: tournId,
          playerID: `guest:${pseudo}`,
          manualTable: Number(table),
          manualSeat: Number(seat),
          op: 'movePlayer',
        },
      }),
    })

    const text = await bvRes.text()

    if (bvRes.status === 200) {
      return res.status(200).json({ ok: true })
    }
    if (bvRes.status === 401) return res.status(200).json({ ok: false, reason: 'token_expired' })
    if (bvRes.status === 403) return res.status(200).json({ ok: false, reason: 'forbidden' })
    return res.status(200).json({ ok: false, reason: `http_${bvRes.status}`, detail: text.slice(0, 200) })
  } catch (e) {
    return res.status(200).json({ ok: false, reason: 'network_error', detail: String(e) })
  }
}
