const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // 1. Tambahkan Header CORS agar browser tidak menolak akses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Tangani Preflight Request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Hanya menerima POST request' });
  }

  try {
    // Pastikan data yang masuk diproses dengan benar
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { nama, wa, tanggal, jam } = body;

    // Simpan ke Supabase
    const { error } = await supabase
      .from('bookings')
      .insert([
        { 
          client_name: nama, 
          client_wa: wa, 
          booking_date: tanggal, 
          booking_time: jam 
        }
      ]);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Crash Detail:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};
