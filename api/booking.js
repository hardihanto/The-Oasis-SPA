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
  if (req.method !== 'POST') return res.status(405).json({ message: 'Gunakan POST' });

  try {
    const { nama, wa, tanggal, jam } = req.body;

    // --- 1. LOGIKA CEK JADWAL BENTROK ---
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', tanggal)
      .eq('booking_time', jam);

    if (checkError) throw checkError;
    
    // Jika data sudah ada, kirim error ke user
    if (existing && existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maaf, jam tersebut sudah dipesan orang lain. Silakan pilih jam lain.' 
      });
    }

    // --- 2. SIMPAN KE DATABASE ---
    const { error: insertError } = await supabase
      .from('bookings')
      .insert([{ client_name: nama, client_wa: wa, booking_date: tanggal, booking_time: jam }]);

    if (insertError) throw insertError;

    // --- 3. KIRIM WHATSAPP (FONNTE) ---
    if (process.env.WA_TOKEN) {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': process.env.WA_TOKEN },
        body: new URLSearchParams({
          target: wa,
          message: `*RESERVASI THE OASIS*\nHalo ${nama},\n\nJadwal Anda pada tanggal *${tanggal}* jam *${jam}* telah kami terima.\n\nSampai jumpa di The Oasis Spa!`
        })
      });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};
