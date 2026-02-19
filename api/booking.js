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

    // 1. Cek Bentrok
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

    // 3. LOGIKA OTOMATISASI WHATSAPP (REMINDER)
    if (process.env.WA_TOKEN) {
      
      // A. Pesan Konfirmasi (Langsung)
      await sendWhatsApp(wa, `*KONFIRMASI THE OASIS*\nHalo ${nama}, reservasi Anda tanggal ${tanggal} jam ${jam} BERHASIL.`);

      // B. Reminder 1 Jam Sebelum (Menggunakan fitur delay Fonnte)
      // Logika: Kita hitung selisih waktu sekarang dengan waktu booking, lalu dikurangi 60 menit.
      const bookingDateTime = new Date(`${tanggal} ${jam}`);
      const now = new Date();
      const delayInSeconds = Math.floor((bookingDateTime - now) / 1000) - 3600; // Dikurangi 1 jam (3600 detik)

      if (delayInSeconds > 0) {
        await sendWhatsApp(wa, `*REMINDER THE OASIS*\nHalo ${nama}, sekedar mengingatkan 1 jam lagi jadwal treatment Anda dimulai. Sampai jumpa!`, delayInSeconds);
      }

      // C. Follow Up 7 Hari Setelah (Delay 604800 detik)
      const delay7Days = 604800; 
      await sendWhatsApp(wa, `*GREETINGS THE OASIS*\nHalo ${nama}, sudah 1 minggu sejak kunjungan terakhir Anda. Bagaimana kabar Anda? Kami harap pelayanan kami memuaskan. Sampai jumpa kembali!`, delay7Days);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Fungsi pembantu untuk kirim ke Fonnte
async function sendWhatsApp(target, message, delay = 0) {
  await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': process.env.WA_TOKEN },
    body: new URLSearchParams({
      target: target,
      message: message,
      delay: delay.toString() // Fonnte akan menyimpan pesan ini dan baru mengirimnya setelah delay berakhir
    })
  });
}
