export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const VERIFY_SID = process.env.TWILIO_VERIFY_SID;

  const { action, telephone, code } = req.body;

  if (!telephone) return res.status(400).json({ error: 'Numéro de téléphone requis' });

  const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

  try {
    if (action === 'send') {
      // Envoyer le code SMS
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: telephone,
            Channel: 'sms'
          }).toString()
        }
      );
      const data = await response.json();
      if (data.status === 'pending') {
        return res.status(200).json({ success: true, message: 'SMS envoyé !' });
      } else {
        return res.status(400).json({ error: data.message || 'Erreur envoi SMS' });
      }

    } else if (action === 'verify') {
      // Vérifier le code
      if (!code) return res.status(400).json({ error: 'Code requis' });
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: telephone,
            Code: code
          }).toString()
        }
      );
      const data = await response.json();
      if (data.status === 'approved') {
        return res.status(200).json({ success: true, message: 'Téléphone vérifié !' });
      } else {
        return res.status(400).json({ error: 'Code incorrect ou expiré' });
      }
    } else {
      return res.status(400).json({ error: 'Action invalide' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
