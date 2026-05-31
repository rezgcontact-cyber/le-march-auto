export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Support tous les noms de variables possibles
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || process.env.SID_COMPTE_TWILIO;
  const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN  || process.env.AUTH_TOKEN_TWILIO;
  const VERIFY_SID  = process.env.TWILIO_VERIFY_SID  || process.env.VERIFY_SID_TWILIO;

  if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SID) {
    console.error('Variables Twilio manquantes:', {
      ACCOUNT_SID: !!ACCOUNT_SID,
      AUTH_TOKEN: !!AUTH_TOKEN,
      VERIFY_SID: !!VERIFY_SID
    });
    return res.status(500).json({ error: 'Configuration Twilio manquante' });
  }

  const { action, telephone, code } = req.body;
  const authHeader = 'Basic ' + Buffer.from(ACCOUNT_SID + ':' + AUTH_TOKEN).toString('base64');

  try {
    if (action === 'send') {
      // Envoyer le SMS de vérification
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ To: telephone, Channel: 'sms' }).toString()
        }
      );

      const data = await response.json();
      console.log('Twilio send response:', data.status, data.sid);

      if (data.sid) {
        return res.status(200).json({ success: true, status: data.status });
      } else {
        return res.status(400).json({ error: data.message || 'Erreur envoi SMS' });
      }

    } else if (action === 'verify') {
      // Vérifier le code
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ To: telephone, Code: code }).toString()
        }
      );

      const data = await response.json();
      console.log('Twilio verify response:', data.status);

      if (data.status === 'approved') {
        return res.status(200).json({ success: true });
      } else {
        return res.status(400).json({ error: 'Code incorrect ou expiré' });
      }

    } else {
      return res.status(400).json({ error: 'Action invalide' });
    }

  } catch (err) {
    console.error('Twilio error:', err);
    return res.status(500).json({ error: err.message });
  }
}
