const { createClient } = require('@supabase/supabase-js');

// Inisialisasi Supabase di luar handler agar lebih cepat
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // Tambahkan Header CORS agar diizinkan oleh browser
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Gunakan metode POST' });
  }

  try {
    // Pastikan req.body sudah berupa objek (Vercel biasanya otomatis memprosesnya)
    const { nama, wa, tanggal, jam } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!nama || !wa) {
      return res.status(400).json({ message: 'Nama dan WA wajib diisi' });
    }

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

    if (error) throw error;

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error detail:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
