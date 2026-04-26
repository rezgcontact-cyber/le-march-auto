export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, to, toName, subject, html, smsTo, smsText } = req.body;
  const BREVO_KEY = process.env.BREVO_API_KEY;

  try {
    // EMAIL
    if (type === 'email') {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Le Marché Auto', email: 'rezg.contact@gmail.com' },
          to: [{ email: to, name: toName || to }],
          subject: subject,
          htmlContent: html
        })
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // SMS
    if (type === 'sms') {
      const r = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
        method: 'POST',
        headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'MarcheAuto',
          recipient: smsTo,
          content: smsText
        })
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return res.status(400).json({ error: 'Type invalide' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
