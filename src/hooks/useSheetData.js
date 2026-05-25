import { useState, useEffect } from 'react';

// 🧠 ENGINE PEMBENTUK MOCK DATA (Disamakan persis dengan indeks Sheet asli Anda)
const createMockDatabase = () => {
  // 1. Tulis data simulasi merchant dalam bentuk objek agar mudah dibaca manusia
  const rawMerchants = [
    { id: '6-CYNUGUTTAADANN', name: 'Ayam Goreng Kremes Sari Sunda - Pamoyanan', am: 'Dadan Nurdiansyah', city: 'Cianjur', status: 'ACTIVE', salesLM: '102,983,137', salesMTD: '59,950,583', gap: '▼13%', suc: '13,502,384', ads: '1,523,829', mca: '1,500,000', gms: 'GMS Booster' },
    { id: '6-KAPAUUNIYEN', name: 'RUMAH MAKAN NASI KAPAU UNI YEN - Sawah Gede', am: 'Dadan Nurdiansyah', city: 'Cianjur', status: 'ACTIVE', salesLM: '80,300,000', salesMTD: '60,319,830', gap: '▲5%', suc: '10,178,163', ads: '381,233', mca: '0', gms: 'GMS Booster' },
    { id: '6-HOMEMADEFOOD', name: 'The Home Made Food - Gadog', am: 'Saepul Hikam', city: 'Garut', status: 'ACTIVE', salesLM: '95,000,000', salesMTD: '76,841,222', gap: '▼10%', suc: '13,845,265', ads: '0', mca: '5,000,000', gms: '0', optOutPkg: 'GMS Booster', optOutDate: '2026-04-19' },
    { id: '6-1990COFFEE', name: '1990 COFFEENERY - Solokpandan', am: 'Dadan Nurdiansyah', city: 'Cianjur', status: 'ACTIVE', salesLM: '50,000,000', salesMTD: '42,612,812', gap: '▼15%', suc: '7,677,984', ads: '0', mca: '0', gms: 'Standard' },
    { id: '6-PARECIANJUR', name: 'Pare Cianjur - Bojong', am: 'Saepul Hikam', city: 'Garut', status: 'ACTIVE', salesLM: '45,000,000', salesMTD: '48,254,000', gap: '▲7%', suc: '10,233,615', ads: '0', mca: '0', gms: '0', optOutPkg: 'Standard', optOutDate: '2026-05-10' }
  ];

  // 2. Petakan objek ke dalam Array berukuran 60 kolom sesuai indeks file asli Anda yah
  const formattedMerchants = rawMerchants.map(m => {
    const row = new Array(65).fill('');
    row[2] = m.am;          // Kolom C (Index 2)
    row[3] = m.id;          // Kolom D (Index 3)
    row[4] = m.name;        // Kolom E (Index 4)
    row[8] = m.city;        // Kolom I (Index 8)
    row[16] = '20-Jun-19';  // Kolom Q (Index 16)
    row[17] = m.status;     // Kolom R (Index 17)
    row[18] = m.salesLM;    // Kolom S (Index 18)
    row[19] = m.salesMTD;   // Kolom T (Index 19)
    row[21] = m.gap;        // Kolom V (Index 21)
    row[27] = m.suc;        // Kolom AB (Index 27)
    row[31] = m.ads;        // Kolom AF (Index 31)
    row[41] = m.mca;        // Kolom AP (Index 41)
    row[47] = m.gms || '0'; // Kolom AW (Index 47)
    row[52] = m.optOutPkg || ''; // Kolom BB (Index 52)
    row[53] = m.optOutDate || ''; // Kolom BC (Index 53)
    return row;
  });

  // 3. Gabungkan KPI global di 3 baris pertama dengan data merchant di bawahnya
  return [
    ['Basketsize Total', 'Rp 334.225.947'], // Baris 1 (Index 0) -> Dibaca Dashboard KPI 1
    ['Ads Spent Total', 'Rp 1.905.062'],   // Baris 2 (Index 1) -> Dibaca Dashboard KPI 2
    ['MCA Amount Total', 'Rp 15.000.000'], // Baris 3 (Index 2) -> Dibaca Dashboard KPI 3
    [],                                    // Baris 4 (Index 3) -> Baris kosong pembatas header
    ...formattedMerchants                  // Baris 5 ke bawah -> Data Master Merchant
  ];
};

export function useSheetData(endpoint) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      
      // ⚡ DETEKSI BULLETPROOF VITE: Menggunakan variabel lingkungan internal
      // Jika di StackBlitz/Lokal npm run dev, ini otomatis bernilai TRUE.
      const isLocalDev = import.meta.env.DEV;

      if (isLocalDev) {
        // Simulasi loading buatan agar UX terasa nyata di lokal
        setTimeout(() => {
          setData(createMockDatabase());
          setError(null);
          setIsLoading(false);
        }, 600);
        return;
      }

      // 🚀 JALUR AMAN PRODUCTION VERCEL (Membaca Google Sheets Asli)
      try {
        const response = await fetch(`/api/${endpoint}`, {
          signal: abortController.signal
        });
        
        if (!response.ok) throw new Error('Gagal menarik data dari server backend');
        
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