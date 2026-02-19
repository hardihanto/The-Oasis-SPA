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

    // 1. Simpan ke Database
    await supabase.from('bookings').insert([{ client_name: nama, client_wa: wa, booking_date: tanggal, booking_time: jam }]);

    // 2. Logika WhatsApp
    if (process.env.WA_TOKEN) {
      // A. Pesan Konfirmasi (Langsung)
await sendWhatsApp(wa, `🌸 *KONFIRMASI RESERVASI SPA THE OASIS* 🌸\n\nHalo ${nama} 😊\nReservasi perawatan Spa Anda pada tanggal ${tanggal} pukul ${jam} telah berhasil dikonfirmasi ✅\n\nKami siap menyambut Anda untuk pengalaman relaksasi terbaik. Sampai jumpa dan nikmati momen istimewa Anda ✨`);

      // B. Pecah tanggal dan jam untuk perhitungan manual (WIB)
      const [year, month, day] = tanggal.split('-').map(Number);
      const [hour, minute] = jam.split(':').map(Number);
      
      // Buat objek waktu booking dalam konteks waktu lokal
      const bookingDate = new Date(year, month - 1, day, hour, minute);

      // C. Reminder 1 Jam Sebelum
      const reminderTime = new Date(bookingDate.getTime() - (60 * 60 * 1000));
      if (reminderTime > new Date()) {
        await sendWhatsApp(wa, `*REMINDER THE OASIS*\nHalo ${nama}, 1 jam lagi jadwal treatment Anda dimulai. Kami tunggu kedatangannya!`, reminderTime);
      }

      // D. Follow Up 7 Hari Setelah
      const followUpTime = new Date(bookingDate.getTime() + (7 * 24 * 60 * 60 * 1000));
      await sendWhatsApp(wa, `*GREETINGS THE OASIS*\nHalo ${nama}, sudah 1 minggu sejak kunjungan Anda. Semoga pelayanan kami memuaskan. Sampai jumpa kembali!`, followUpTime);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// FUNGSI PENGIRIMAN DENGAN FORMAT TANGGAL MANUAL (MENCEGAH SELISIH 7 JAM)
async function sendWhatsApp(target, message, scheduleDate = null) {
  const formData = new URLSearchParams();
  formData.append('target', target);
  formData.append('message', message);
  
  if (scheduleDate) {
    // MENGGUNAKAN UNIX TIMESTAMP (DETIK)
    // Ini adalah cara paling akurat untuk mengirim jadwal ke Fonnte
    const unixTimestamp = Math.floor(scheduleDate.getTime() / 1000);
    formData.append('schedule', unixTimestamp); 
  }

  await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': process.env.WA_TOKEN },
    body: formData
  });
}
