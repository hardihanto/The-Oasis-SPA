import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { nama, wa, tanggal, jam } = JSON.parse(req.body);

    // 1. Cek duplikasi jadwal
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', tanggal)
      .eq('booking_time', jam);

    if (checkError) throw new Error('Gagal cek database: ' + checkError.message);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Jadwal sudah terkunci, pilih waktu lain.' });
    }

    // 2. Simpan ke database
    const { error: insertError } = await supabase.from('bookings').insert([
      { client_name: nama, client_wa: wa, booking_date: tanggal, booking_time: jam }
    ]);

    if (insertError) throw new Error('Gagal simpan data: ' + insertError.message);

    // 3. Kirim WhatsApp (Fonnte)
    if (process.env.WA_TOKEN) {
        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { 'Authorization': process.env.WA_TOKEN },
          body: new URLSearchParams({
            target: wa,
            message: `*RESERVASI THE OASIS*\nHalo ${nama}, jadwal Anda pada ${tanggal} jam ${jam} telah TERKUNCI. Terima kasih.`
          })
        });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
