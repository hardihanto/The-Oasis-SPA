const { createClient } = require('@supabase/supabase-js');

// Pindahkan inisialisasi ke dalam handler untuk memastikan variabel env terbaca
module.exports = async (req, res) => {
  // 1. Tambahkan Header CORS (Penting agar tidak error di browser)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Hanya menerima POST' });
  }

  try {
    // Inisialisasi Supabase di dalam sini
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variabel lingkungan Supabase tidak ditemukan di Vercel');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ambil data dari body
    const { nama, wa, tanggal, jam } = req.body;

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

    if (error) throw error;

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Server Crash: ' + err.message 
    });
  }
};
