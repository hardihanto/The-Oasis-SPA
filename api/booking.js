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

    // 3. LOGIKA OTOMATISASI WHATSAPP
    if (process.env.WA_TOKEN) {
     // A. Pesan Konfirmasi (Langsung)
await sendWhatsApp(wa, `🌸 *KONFIRMASI RESERVASI SPA THE OASIS* 🌸\n\nHalo ${nama} 😊\nReservasi perawatan Spa Anda pada tanggal ${tanggal} pukul ${jam} telah berhasil dikonfirmasi ✅\n\nKami siap menyambut Anda untuk pengalaman relaksasi terbaik. Sampai jumpa dan nikmati momen istimewa Anda ✨`);

      // B. Reminder 1 Jam Sebelum
      // Menghitung waktu kirim: Waktu booking dikurangi 1 jam
      const bookingTime = new Date(`${tanggal} ${jam}`);
      const reminderTime = new Date(bookingTime.getTime() - (60 * 60 * 1000));
      
      // Kirim hanya jika waktu reminder masih di masa depan
      if (reminderTime > new Date()) {
        await sendWhatsApp(wa, `*REMINDER THE OASIS*\nHalo ${nama}, 1 jam lagi jadwal treatment Anda dimulai. Kami tunggu kedatangannya!`, reminderTime);
      }

      // C. Follow Up 7 Hari Setelah
      const followUpTime = new Date(bookingTime.getTime() + (7 * 24 * 60 * 60 * 1000));
      await sendWhatsApp(wa, `*GREETINGS THE OASIS*\nHalo ${nama}, sudah 1 minggu sejak kunjungan Anda. Semoga pelayanan kami memuaskan. Sampai jumpa kembali!`, followUpTime);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

async function sendWhatsApp(target, message, scheduleTime = null) {
  const formData = new URLSearchParams();
  formData.append('target', target);
  formData.append('message', message);
  
  // Jika ada jadwal, gunakan parameter 'schedule' (format Fonnte untuk waktu spesifik)
  if (scheduleTime) {
    // Format: YYYY-MM-DD HH:MM:SS
    const formattedDate = scheduleTime.toISOString().replace('T', ' ').substring(0, 19);
    formData.append('schedule', formattedDate);
  }

  await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': process.env.WA_TOKEN },
    body: formData
  });
}
