export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const BREVO_KEY = process.env.BREVO_API_KEY;
  const { to, toName, subject, html, type } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Le Marché Auto",
          email: "rezg.contact@gmail.com"
        },
        to: [{ email: to, name: toName || to }],
        subject: subject,
        htmlContent: html
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
