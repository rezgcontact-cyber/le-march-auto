export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const { action, table, filters, data, id } = req.body || req.query;

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    let url, response, result;

    switch(req.method) {
      case 'GET':
        url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=date_creation.desc`;
        if (filters) url += '&' + filters;
        response = await fetch(url, { headers });
        result = await response.json();
        return res.status(200).json(result);

      case 'POST':
        if (action === 'getOne') {
          url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`;
          if (filters) url += '&' + filters;
          response = await fetch(url, { headers });
          result = await response.json();
          return res.status(200).json(result);
        }
        // Insert
        url = `${SUPABASE_URL}/rest/v1/${table}`;
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const err = await response.json();
          return res.status(400).json({ error: err.message || 'Erreur insertion' });
        }
        result = await response.json();
        return res.status(200).json(result);

      case 'PATCH':
        url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
        response = await fetch(url, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data)
        });
        return res.status(200).json({ success: true });

      case 'DELETE':
        url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
        response = await fetch(url, { method: 'DELETE', headers });
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
