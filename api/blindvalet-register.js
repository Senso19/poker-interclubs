// Relais serveur vers la Cloud Function BlindValet "tournamentRegister".
// Un navigateur ne peut pas appeler directement cette fonction (CORS), donc
// on passe par ce petit proxy Vercel, comme le faisait la macro VBA côté Excel
// (mêmes en-têtes Origin/Referer, même format de corps de requête).

const BLINDVALET_REGISTER_URL = 'https://us-central1-blindvalet-production.cloudfunctions.net/tournamentOp'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'method_not_allowed' })
  }

  const { token, tournId, pseudo } = req.body || {}
  if (!token || !tournId || !pseudo) {
    return res.status(400).json({ ok: false, reason: 'missing_params' })
  }

  try {
    const bvRes = await fetch(BLINDVALET_REGISTER_URL, {
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
          uid: `guest:${pseudo}`,
          memberName: pseudo,
          manual: true,
          guest: true,
          undoAction: false,
          op: 'tournamentRegister',
        },
      }),
    })

    const text = await bvRes.text()

    if (bvRes.status === 200) {
      const already = /already|duplicate/i.test(text)
      return res.status(200).json({ ok: true, already })
    }
    if (bvRes.status === 401) return res.status(200).json({ ok: false, reason: 'token_expired' })
    if (bvRes.status === 403) return res.status(200).json({ ok: false, reason: 'forbidden' })
    return res.status(200).json({ ok: false, reason: `http_${bvRes.status}`, detail: text.slice(0, 200) })
  } catch (e) {
    return res.status(200).json({ ok: false, reason: 'network_error', detail: String(e) })
  }
}
