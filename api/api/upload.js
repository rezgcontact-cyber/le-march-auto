export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const { fileName, fileData, fileType } = req.body;
    if (!fileName || !fileData) return res.status(400).json({ error: 'Fichier manquant' });

    // Décoder le base64
    const buffer = Buffer.from(fileData, 'base64');

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/annonces-photos/${fileName}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': fileType || 'image/jpeg',
          'x-upsert': 'true'
        },
        body: buffer
      }
    );

    if (response.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/annonces-photos/${fileName}`;
      return res.status(200).json({ success: true, url: publicUrl });
    } else {
      const err = await response.json();
      return res.status(400).json({ error: err.message || 'Erreur upload' });
    }
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
