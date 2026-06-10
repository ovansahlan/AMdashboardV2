import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // 1. Tangkap parameter tab
    const requestedTab = req.query.tab || 'getDashboard';

    // 2. Logic mapping target range
    let targetRange = 'Master_Outlet!A:BZ'; 

    if (requestedTab === 'getHistoris') {
      targetRange = 'Historis_Bulanan!A:AZ';
    } else if (requestedTab === 'getRawDaily') {
      // Anda bisa ubah ini jadi 'Raw_DailyJuni26!A:Z' jika namanya memang itu
      targetRange = 'Raw_daily!A:Z'; 
    }

    try {
      // 3. Tarik data dari Google Sheets
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: targetRange, 
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        return res.status(200).json({ data: [] });
      }

      return res.status(200).json({ data: rows });

    } catch (sheetError) {
      // ⚡ PROTEKSI ANTI-CRASH: Jika tab tidak ditemukan, kembalikan array kosong!
      if (sheetError.message && sheetError.message.includes('Unable to parse range')) {
        console.warn(`[WARNING] Tab tidak ditemukan: ${targetRange}. Mengembalikan data kosong.`);
        return res.status(200).json({ data: [] }); // Selamatkan aplikasi dari crash
      }
      
      // Jika errornya bukan karena tab hilang (misal masalah izin), lempar ke catch luar
      throw sheetError; 
    }

  } catch (error) {
    console.error('API Error Detail:', error);
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan internal API' });
  }
}