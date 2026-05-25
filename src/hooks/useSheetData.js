import { useState, useEffect } from 'react';

// 🧠 ENGINE PEMBENTUK MOCK DATA (Disamakan persis dengan skema kolom C - BS asli Anda)
const createMockDatabase = () => {
  const rawMerchants = [
    { name: 'Ayam Goreng Kremes Sari Sunda - Pamoyanan', sales: '59,950,583', investment: '20,269,338', ads: '1,523,829', pts: '1.5', mcaStatus: 'disbursed', mcaDate: '12-May-26', mcaAmt: '15,000,000', suc: '13,502,384' },
    { name: 'RUMAH MAKAN NASI KAPAU UNI YEN - Sawah Gede', sales: '60,319,830', investment: '20,641,676', ads: '381,233', pts: '2.0', mcaStatus: 'disbursed', mcaDate: '15-Jan-26', mcaAmt: '45,000,000', suc: '10,178,163' },
    { name: 'The Home Made Food - Gadog', sales: '76,841,222', investment: '25,484,134', ads: '0', pts: '0.5', mcaStatus: 'disbursed', mcaDate: '19-May-26', mcaAmt: '30,000,000', suc: '13,845,265' },
    { name: '1990 COFFEENERY - Solokpandan', sales: '42,612,812', investment: '8,323,984', ads: '0', pts: '1.0', mcaStatus: 'pending', mcaDate: '', mcaAmt: '0', suc: '7,677,984' },
    { name: 'Pare Cianjur - Bojong', sales: '48,254,000', investment: '18,247,291', ads: '850,000', pts: '3.0', mcaStatus: 'disbursed', mcaDate: '20-May-26', mcaAmt: '12,000,000', suc: '10,233,615' }
  ];

  const formattedMerchants = rawMerchants.map(m => {
    const row = new Array(70).fill('');
    row[2] = 'Dadan Nurdiansyah'; // Kolom C (Index 2): AM Name
    row[4] = m.name;             // Kolom E (Index 4): Mex Name
    row[19] = m.sales;           // Kolom T (Index 19): MTD (BS)
    row[23] = m.investment;      // Kolom X (Index 23): MTD (MI)
    row[27] = m.suc;             // Kolom AB (Index 27): SUC (MI)
    row[31] = m.ads;             // Kolom AF (Index 31): Total MTD (Ads)
    row[39] = m.mcaStatus;       // Kolom AN (Index 39): Disburse Status
    row[40] = m.mcaDate;         // Kolom AO (Index 40): Disbursed date
    row[41] = m.mcaAmt;          // Kolom AP (Index 41): MCA Amount
    row[45] = m.pts;             // Kolom AT (Index 45): Total Point Campaign
    return row;
  });

  return [
    ['Header Info', 'MEI 2026'], [], [], [], // Baris 1-4 dummy header
    ...formattedMerchants // Baris 5 ke bawah data merchant asli
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
      const isLocalDev = import.meta.env.DEV;

      if (isLocalDev) {
        setTimeout(() => {
          setData(createMockDatabase());
          setError(null);
          setIsLoading(false);
        }, 500);
        return;
      }

      try {
        const response = await fetch(`/api/${endpoint}?t=${Date.now()}`, {
          signal: abortController.signal
        });
        if (!response.ok) throw new Error('Gagal menarik data dari API Vercel');
        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => abortController.abort();
  }, [endpoint]);

  return { data, isLoading, error };
}