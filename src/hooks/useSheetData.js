import { useState, useEffect } from 'react';

// 🧠 ENGINE PEMBENTUK MOCK DATA (15 Merchant Simulasi Lengkap)
const createMockDatabase = () => {
  const rawMerchants = [
    { name: 'Ayam Goreng Sari Sunda - Pamoyanan', am: 'Dadan Nurdiansyah', sales: '85,500,000', salesLM: '70,000,000', rr: '90,000,000', investment: '20,000,000', ads: '2,500,000', adsLM: '1,500,000', pts: '2.5', mcaStatus: 'disbursed', mcaDate: '12-May-26', mcaAmt: '15,000,000', campaign: 'GMS Booster | Local Custom/MFC' },
    { name: 'RM Nasi Kapau Uni Yen - Sawah Gede', am: 'Dadan Nurdiansyah', sales: '60,319,830', salesLM: '62,000,000', rr: '61,000,000', investment: '15,000,000', ads: '800,000', adsLM: '1,000,000', pts: '1.5', mcaStatus: 'disbursed', mcaDate: '15-Jan-26', mcaAmt: '45,000,000', campaign: 'GMS Booster' },
    { name: 'The Home Made Food - Gadog', am: 'Saepul Hikam', sales: '76,841,222', salesLM: '85,000,000', rr: '70,000,000', investment: '25,000,000', ads: '0', adsLM: '500,000', pts: '0.5', mcaStatus: 'disbursed', mcaDate: '19-May-26', mcaAmt: '30,000,000', campaign: 'Local Custom/MFC Only' },
    { name: '1990 COFFEENERY - Solokpandan', am: 'Dadan Nurdiansyah', sales: '42,612,812', salesLM: '30,000,000', rr: '45,000,000', investment: '8,000,000', ads: '1,200,000', adsLM: '800,000', pts: '2.0', mcaStatus: 'pending', mcaDate: '', mcaAmt: '0', campaign: 'GMS Booster | Diskon Ongkir' },
    { name: 'Pare Cianjur - Bojong', am: 'Saepul Hikam', sales: '48,254,000', salesLM: '48,000,000', rr: '48,500,000', investment: '18,000,000', ads: '850,000', adsLM: '850,000', pts: '3.0', mcaStatus: 'disbursed', mcaDate: '20-May-26', mcaAmt: '12,000,000', campaign: 'GMS Cuan | Local Custom/MFC' },
    { name: 'Seblak Jeletot - Tarogong', am: 'Saepul Hikam', sales: '35,000,000', salesLM: '20,000,000', rr: '38,000,000', investment: '5,000,000', ads: '300,000', adsLM: '100,000', pts: '1.0', mcaStatus: '', mcaDate: '', mcaAmt: '0', campaign: '-no campaign' },
    { name: 'Kopi Kenangan - Cipanas', am: 'Rizal', sales: '120,500,000', salesLM: '110,000,000', rr: '125,000,000', investment: '30,000,000', ads: '5,000,000', adsLM: '4,500,000', pts: '5.0', mcaStatus: 'disbursed', mcaDate: '05-May-26', mcaAmt: '50,000,000', campaign: 'GMS Booster | WeekendFest' },
    { name: 'Martabak Manis Legit - Pacet', am: 'Rizal', sales: '55,400,000', salesLM: '60,000,000', rr: '52,000,000', investment: '12,000,000', ads: '1,000,000', adsLM: '1,500,000', pts: '1.5', mcaStatus: '', mcaDate: '', mcaAmt: '0', campaign: 'GMS Cuan' },
    { name: 'Sate Maranggi Sari Asih', am: 'Dadan Nurdiansyah', sales: '95,000,000', salesLM: '90,000,000', rr: '98,000,000', investment: '22,000,000', ads: '3,200,000', adsLM: '3,000,000', pts: '3.5', mcaStatus: 'disbursed', mcaDate: '01-May-26', mcaAmt: '20,000,000', campaign: 'Local Custom/MFC Only' },
    { name: 'Mie Gacoan - Suci', am: 'Tia', sales: '210,000,000', salesLM: '200,000,000', rr: '215,000,000', investment: '40,000,000', ads: '8,000,000', adsLM: '7,500,000', pts: '4.0', mcaStatus: 'disbursed', mcaDate: '10-May-26', mcaAmt: '100,000,000', campaign: 'GMS Booster | Local Custom' },
    { name: 'Ayam Geprek Bensu', am: 'Tia', sales: '65,000,000', salesLM: '75,000,000', rr: '60,000,000', investment: '14,000,000', ads: '1,500,000', adsLM: '2,000,000', pts: '2.0', mcaStatus: '', mcaDate: '', mcaAmt: '0', campaign: 'GMS Booster' },
    { name: 'Burger Bangor - Sindanglaya', am: 'Rizal', sales: '45,000,000', salesLM: '40,000,000', rr: '48,000,000', investment: '10,000,000', ads: '900,000', adsLM: '800,000', pts: '1.0', mcaStatus: 'pending', mcaDate: '', mcaAmt: '0', campaign: 'Local Custom/MFC Only' },
    { name: 'Chatime - Citimall', am: 'Saepul Hikam', sales: '88,000,000', salesLM: '88,500,000', rr: '88,000,000', investment: '18,000,000', ads: '2,000,000', adsLM: '2,000,000', pts: '2.5', mcaStatus: 'disbursed', mcaDate: '15-May-26', mcaAmt: '25,000,000', campaign: 'GMS Booster' },
    { name: 'Mixue - Karangtengah', am: 'Tia', sales: '150,000,000', salesLM: '120,000,000', rr: '160,000,000', investment: '25,000,000', ads: '4,000,000', adsLM: '3,000,000', pts: '3.0', mcaStatus: 'disbursed', mcaDate: '20-May-26', mcaAmt: '40,000,000', campaign: 'GMS Cuan | Diskon Ongkir' },
    { name: 'Nasi Goreng Mafia', am: 'Dadan Nurdiansyah', sales: '28,000,000', salesLM: '35,000,000', rr: '25,000,000', investment: '5,000,000', ads: '200,000', adsLM: '500,000', pts: '0', mcaStatus: '', mcaDate: '', mcaAmt: '0', campaign: '-no campaign' },
  ];

  // Memetakan ke indeks Array yang sama persis dengan Google Sheet
  const formattedMerchants = rawMerchants.map(m => {
    const row = new Array(70).fill('');
    row[2] = m.am;             // Kolom C: AM Name
    row[4] = m.name;           // Kolom E: Mex Name
    row[18] = m.salesLM;       // Kolom S: Last Month (BS)
    row[19] = m.sales;         // Kolom T: MTD (BS)
    row[20] = m.rr;            // Kolom U: Runrate (BS)
    row[23] = m.investment;    // Kolom X: MTD (MI)
    row[30] = m.adsLM;         // Kolom AE: Last Month (Ads)
    row[31] = m.ads;           // Kolom AF: Total MTD (Ads)
    row[39] = m.mcaStatus;     // Kolom AN: Disburse Status
    row[40] = m.mcaDate;       // Kolom AO: Disbursed date
    row[41] = m.mcaAmt;        // Kolom AP: MCA Amount
    row[44] = m.campaign;      // Kolom AS: Campaign 
    row[45] = m.pts;           // Kolom AT: Total Point Campaign
    return row;
  });

  return [
    ['Header Info', 'MEI 2026'], [], [], [], // 4 Baris dummy header agar sinkron dengan baris asli (mulai data di index 4)
    ...formattedMerchants
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

      // JIKA BERJALAN DI STACKBLITZ LOKAL
      if (isLocalDev) {
        setTimeout(() => {
          setData(createMockDatabase());
          setError(null);
          setIsLoading(false);
        }, 500); // Simulasi delay internet
        return;
      }

      // JIKA BERJALAN DI VERCEL PRODUCTION
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