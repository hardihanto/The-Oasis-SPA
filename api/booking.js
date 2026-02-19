import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { nama, wa, tanggal, jam } = JSON.parse(req.body);

  try {
    // 1. CEK KETERSEDIAAN: Cari apakah sudah ada booking di tanggal & jam tersebut
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', tanggal)
      .eq('booking_time', jam);

    if (checkError) throw checkError;

    // Jika jadwal sudah ada (terkunci), kirim pesan error ke frontend
    if (existingBooking.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Jadwal yang Anda pilih sudah dipesan. Mohon pilih waktu atau hari lain.' 
      });
    }

    // 2. SIMPAN: Jika jadwal tersedia, lanjutkan simpan ke Database
    const { error: insertError } = await supabase.from('bookings').insert([
      { client_name: nama, client_wa: wa, booking_date: tanggal, booking_time: jam }
    ]);
    
    if (insertError) throw insertError;

    // 3. NOTIFIKASI: Kirim pesan otomatis via WhatsApp Fonnte
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': process.env.WA_TOKEN },
      body: new URLSearchParams({
        target: wa,
        message: `*RESERVASI BERHASIL - THE OASIS*\n\nHalo ${nama},\n\nJadwal Anda telah kami kunci untuk:\n\n📅 *Tanggal:* ${tanggal}\n⏰ *Waktu:* ${jam}\n\nTim Concierge kami akan segera melakukan persiapan untuk menyambut Anda.\n\nTerima kasih.`
      })
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
