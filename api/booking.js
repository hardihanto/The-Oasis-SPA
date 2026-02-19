export default async function handler(req, res) {
    const { nama, wa } = JSON.parse(req.body);
    
    // Kirim WA via Fonnte
    await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': process.env.WA_TOKEN },
        body: new URLSearchParams({
            target: wa,
            message: `Konfirmasi VVIP: Halo ${nama}, ritual Anda di The Oasis telah dijadwalkan. Sampai jumpa di Sanctuary kami.`
        })
    });

    return res.status(200).json({ success: true });
}
