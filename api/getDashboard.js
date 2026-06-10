import { google } from 'googleapis';

export default async function handler(req, res) {
  // Hanya izinkan method GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Membaca kredensial dari Environment Variables Vercel
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Replace regex ini penting agar Vercel bisa membaca private key yang memiliki newline (\n)
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // ⚡ 1. TANGKAP PARAMETER TAB DARI FRONTEND
    // Jika tidak ada parameter (misal di halaman awal), default ke 'getDashboard'
    const requestedTab = req.query.tab || 'getDashboard';

    // ⚡ 2. MAPPING LOGIKA RANGE SHEET
    let targetRange = 'Master_Outlet!A:BZ'; // Default untuk Dashboard Utama & Merchant List

    if (requestedTab === 'getHistoris') {
      targetRange = 'Historis_Bulanan!A:AZ'; // Arahkan ke tab historis (Beri jarak sampai kolom AZ untuk aman)
    } else if (requestedTab === 'getRawDaily') {
      targetRange = 'Raw_daily!A:Z'; // Persiapan untuk mengarah ke tab harian
    }

    // ⚡ 3. TARIK DATA DARI GOOGLE SHEETS API BERDASARKAN RANGE DINAMIS
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: targetRange, 
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Mengirim data JSON ke Frontend React
    return res.status(200).json({ data: rows });

  } catch (error) {
    console.error('Sheets API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}