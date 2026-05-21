import { useState, useEffect } from 'react';

// 📦 DATA SIMULASI (Mock Data)
// Otomatis digunakan HANYA di StackBlitz/Lokal agar preview tidak error.
// Strukturnya disamakan dengan format array-of-arrays Google Sheets.
const MOCK_DATABASE = {
  getDashboard: [
    ['Basketsize', 'Rp 135.200'], // Baris 1: KPI Basketsize
    ['Ads Spent', 'Rp 4.800.000'], // Baris 2: KPI Ads Spent
    ['MCA Rate', '18.7%'],         // Baris 3: KPI MCA
    [],                             // Baris 4: Kosong/Pemisah
    // Baris 5 ke bawah: Data Merchant [Nama, Sales, Ads, Orders]
    ['Merchant Alpha', '25000000', '3500000', '150'],
    ['Merchant Beta', '19800000', '2100000', '124'],
    ['Merchant Gamma', '15000000', '4000000', '98'],
    ['Merchant Delta', '12400000', '1200000', '85'],
    ['Merchant Epsilon', '9500000', '800000', '60'],
    ['Merchant Zeta', '8200000', '1500000', '52'],
    ['Merchant Eta', '7100000', '500000', '45'],
    ['Merchant Theta', '5400000', '300000', '31'],
    ['Merchant Iota', '4200000', '900000', '28'],
    ['Merchant Kappa', '3100000', '200000', '15'],
  ]
};

export function useSheetData(endpoint) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      
      // 🕵️‍♂️ DETEKSI LINGKUNGAN (StackBlitz / Localhost)
      const isLocal = window.location.hostname.includes('stackblitz') || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

      if (isLocal) {
        // Jika di lokal, gunakan data simulasi dengan efek loading buatan (800ms) agar terasa real
        setTimeout(() => {
          setData(MOCK_DATABASE[endpoint] || []);
          setError(null);
          setIsLoading(false);
        }, 800);
        return;
      }

      // 🚀 LINGKUNGAN PRODUCTION (Vercel Server)
      // Jika sudah live di Vercel, jalankan fungsi API asli ke Google Sheets
      try {
        const response = await fetch(`/api/${endpoint}`, {
          signal: abortController.signal
        });
        
        if (!response.ok) throw new Error('Gagal mengambil data dari Google Sheets API');
        
        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [endpoint]);

  return { data, isLoading, error };
}