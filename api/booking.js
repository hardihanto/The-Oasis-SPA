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

      // B. Perhitungan Waktu dengan Koreksi UTC ke WIB (-7 Jam)
      const bookingDate = new Date(`${tanggal}T${jam}:00`);
      
      // Reminder 1 Jam Sebelum: (Booking - 1 jam) - 7 jam koreksi UTC
      const reminderTime = new Date(bookingDate.getTime() - (8 * 60 * 60 * 1000)); 

      // Follow Up 7 Hari: (Booking + 7 hari) - 7 jam koreksi UTC
      const followUpTime = new Date(bookingDate.getTime() + (7 * 24 * 60 * 60 * 1000) - (7 * 60 * 60 * 1000));

      // Kirim ke Fonnte
      if (reminderTime > new Date(new Date().getTime() - (7 * 60 * 60 * 1000))) {
          await sendWhatsApp(wa, `*REMINDER THE OASIS*\nHalo ${nama}, 1 jam lagi jadwal treatment Anda dimulai. Kami tunggu kedatangannya!`, reminderTime);
      }
      
      await sendWhatsApp(wa, `*GREETINGS THE OASIS*\nHalo ${nama}, sudah 1 minggu sejak kunjungan Anda. Semoga pelayanan kami memuaskan.`, followUpTime);
    }

// ... (bagian bawah script tetap sama)

async function sendWhatsApp(target, message, scheduleTime = null) {
  const formData = new URLSearchParams();
  formData.append('target', target);
  formData.append('message', message);
  
  if (scheduleTime) {
    // Gunakan format ISO yang sudah dimodifikasi untuk Fonnte
    const formattedDate = scheduleTime.toISOString().replace('T', ' ').substring(0, 19);
    formData.append('schedule', formattedDate);
  }

  await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': process.env.WA_TOKEN },
    body: formData
  });
}
