export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  const { type, amount, description, successUrl, cancelUrl } = req.body;

  try {
    // Créer une session de paiement Stripe Checkout
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_SECRET,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][product_data][name]': description || 'Le Marché Auto',
        'line_items[0][price_data][unit_amount]': Math.round(amount * 100), // en centimes
        'line_items[0][quantity]': '1',
        'mode': type === 'abonnement' ? 'subscription' : 'payment',
        'success_url': successUrl || 'https://le-march-auto.fr?paiement=success',
        'cancel_url': cancelUrl || 'https://le-march-auto.fr?paiement=cancel',
        'locale': 'fr'
      }).toString()
    });

    const session = await response.json();

    if (session.url) {
      return res.status(200).json({ success: true, url: session.url, sessionId: session.id });
    } else {
      return res.status(400).json({ error: session.error?.message || 'Erreur Stripe' });
    }
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
