const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const { nama, wa, tanggal, jam } = req.body;

    // 1. Cek Jadwal Bentrok
    const { data: existing } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', tanggal)
      .eq('booking_time', jam);

    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Jam sudah terisi.' });
    }

    // 2. Simpan ke Database
    await supabase.from('bookings').insert([{ client_name: nama, client_wa: wa, booking_date: tanggal, booking_time: jam }]);

    // 3. Kirim Konfirmasi WhatsApp Instan (Fonnte)
    if (process.env.WA_TOKEN) {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': process.env.WA_TOKEN },
        body: new URLSearchParams({
          target: wa,
          message: `*KONFIRMASI THE OASIS*\nHalo ${nama}, reservasi Anda tanggal ${tanggal} jam ${jam} BERHASIL.`
        })
      });
    }

    // --- LOGIKA REMINDER (Dikelola via API Google Tasks/Reminder) ---
    // Kami akan mengirimkan instruksi ke sistem pengingat Anda
    
    return res.status(200).json({ 
      success: true, 
      message: 'Booking berhasil',
      reminder_data: { nama, wa, tanggal, jam } 
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
