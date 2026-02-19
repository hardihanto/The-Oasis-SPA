import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { nama, wa, tanggal, jam } = JSON.parse(req.body);

    // 1. Validasi Input
    if (!nama || !wa || !tanggal || !jam) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    // 2. Simpan ke Supabase
    const { error: insertError } = await supabase.from('bookings').insert([
      { 
        client_name: nama, 
        client_wa: wa, 
        booking_date: tanggal, 
        booking_time: jam 
      }
    ]);

    if (insertError) {
        return res.status(500).json({ success: false, message: 'Database Error: ' + insertError.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server Crash: ' + err.message });
  }
}
