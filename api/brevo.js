export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Support tous les noms de variables possibles
  const BREVO_KEY = process.env.BREVO_API_KEY || process.env.CLÉ_API_BREVO || process.env.CLE_API_BREVO;

  if (!BREVO_KEY) {
    console.error('Clé Brevo manquante');
    return res.status(500).json({ error: 'Configuration Brevo manquante' });
  }

  const { to, toName, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Paramètres manquants (to, subject, html)' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Le Marché Auto', email: 'rezg.contact@gmail.com' },
        to: [{ email: to, name: toName || to }],
        subject: subject,
        htmlContent: html
      })
    });

    const data = await response.json();
    console.log('Brevo response:', data.messageId || data.message);

    if (data.messageId) {
      return res.status(200).json({ success: true, messageId: data.messageId });
    } else {
      return res.status(400).json({ error: data.message || 'Erreur envoi email' });
    }

  } catch (err) {
    console.error('Brevo error:', err);
    return res.status(500).json({ error: err.message });
  }
}
