import { useState, useEffect } from 'react';

// 🧠 ENGINE PEMBENTUK MOCK DATA (15 Merchant Simulasi Lengkap)
const createMockDatabase = () => {
  const rawMerchants = [
    { name: 'Ayam Goreng Sari Sunda - Pamoyanan', am: 'Dadan Nurdiansyah', sales: '85,500,000', salesLM: '70,000,000', rr: '90,000,000', investment: '20,000,000', ads: '2,500,000', adsLM: '1,500,000', pts: '2.5', mcaStatus: 'disbursed', mcaDate: '12-May-26', mcaAmt: '15,000,000', campaign: 'GMS Booster | Local Custom/MFC' },
    { name: 'RM Nasi Kapau Uni Yen - Sawah Gede', am: 'Dadan Nurdiansyah', sales: '60,319,830', salesLM: '62,000,000', rr: '61,000,000', investment: '15,000,000', ads: '800,000', adsLM: '1,000,000', pts: '1.5', mcaStatus: 'disbursed', mcaDate: '15-Jan-26', mcaAmt: '45,000,000', campaign: 'GMS Booster' },
    { name: 'The Home Made Food - Gadog', am: 'Saepul Hikam', sales: '76,841,222', salesLM: '85,000,000', rr: '70,000,000', investment: '25,000,000', ads: '0', adsLM: '500,000', pts: '0.5', mcaStatus: 'disbursed', mcaDate: '19-May-26', mcaAmt: '30,000,000', campaign: 'Local Custom/MFC Only' },
    { name: '1990 COFFEENERY - Solokpandan', am: 'Dadan Nurdiansyah', sales: '42,612,812', salesLM: '30,000,000', rr: '45,000,000', investment: '8,000,000', ads: '1,200,000', adsLM: '800,000', pts: '2.0', mcaStatus: 'pending', mcaDate: '', mcaAmt: '0', campaign: 'GMS Booster | Diskon Ongkir' },
    { name: 'Pare Cianjur - Bojong', am: 'Saepul Hikam', sales: '48,254,000', salesLM: '48,000,000', rr: '48,500,000', investment: '18,000,000', ads: '850,000', adsLM: '850,000', pts: '3.0', mcaStatus: 'disbursed', mcaDate: '20-May-26', mcaAmt: '12,000,000', campaign: 'GMS Cuan | Local Custom/MFC' },
  ];

  const formattedMerchants = rawMerchants.map(m => {
    const row = new Array(70).fill('');
    row[2] = m.am;             
    row[4] = m.name;           
    row[18] = m.salesLM;       
    row[19] = m.sales;         
    row[20] = m.rr;            
    row[23] = m.investment;    
    row[30] = m.adsLM;         
    row[31] = m.ads;           
    row[37] = m.mcaAmt;        
    row[39] = m.mcaStatus;     
    row[40] = m.mcaDate;       
    row[41] = m.mcaAmt;        
    row[44] = m.campaign;      
    row[45] = m.pts;           
    return row;
  });

  return [
    ['Header Info', 'MEI 2026', 'Update: 15 Juni 2026'], [], [], [], 
    ...formattedMerchants
  ];
};

const createMockHistoris = () => {
  // Simulasi struktur persis seperti file Historis_Bulanan.csv
  const headers = [
    'latest_update', 'first_day_of_month', 'merchant_id', 'merchant_name', 'user', 
    'completed_orders', 'total_orders', 'orders_with_promo_mfp_gms', 'gmv', 'basket_size', 
    'mfp_mex_spend', 'mfc_mex_spend', 'cpo', 'gms', 'basic_commission', 
    'aov', 'ads_mobile', 'ads_web', 'ads_direct', 'ppd_co', 'ppd_gmv', 
    'co_with_ads', 'bs_with_ads', 'co_a_0_20rb', 'co_b_20_40rb', 'co_c_40_60rb', 
    'co_d_60_100rb', 'co_e_above_100rb', 'photo_penetration', 'active_hours_monthly'
  ];

  const mockRows = [];
  const merchants = [
    'Ayam Goreng Sari Sunda - Pamoyanan',
    'RM Nasi Kapau Uni Yen - Sawah Gede',
    'The Home Made Food - Gadog',
    '1990 COFFEENERY - Solokpandan',
    'Pare Cianjur - Bojong'
  ];

  merchants.forEach((mexName, idx) => {
    const mexId = `MEX-${1000 + idx}`;
    // Buat data mundur 6 bulan (Jan - Jun 2026)
    for (let month = 1; month <= 6; month++) {
      const baseBS = 40000000 + (Math.random() * 30000000) + (month * 5000000); // Trend Naik
      const baseComm = baseBS * 0.20; // Komisi 20%
      const mfp = baseBS * 0.05; // MFP 5%
      const mfc = baseBS * 0.02; // MFC 2%
      const ads = baseBS * 0.03; // Ads 3%
      
      mockRows.push([
        `6/7/2026`, `${month}/1/2026`, mexId, mexName, 'user-id',
        '1000', '1200', '300', '0', String(baseBS),
        String(mfp), String(mfc), '0', '0', String(baseComm),
        '45000', String(ads * 0.6), String(ads * 0.4), '0', '0', '0',
        '0', '0', '0', '0', '0', '0', '0', '95%', '300'
      ]);
    }
  });

  return [headers, ...mockRows];
};

const createMockDaily = () => {
  const dates = Array.from({length: 15}, (_, i) => `2026-06-${String(i+1).padStart(2, '0')}`);
  const baseData = [
    { name: 'Ayam Goreng Sari Sunda - Pamoyanan', baseOrders: 60, baseAds: 80000 },
    { name: 'RM Nasi Kapau Uni Yen - Sawah Gede', baseOrders: 40, baseAds: 25000 },
    { name: 'The Home Made Food - Gadog', baseOrders: 50, baseAds: 0 }
  ];
  const rows = [['Tanggal', 'Mex Name', 'Completed Orders', 'Daily Ads Spent']];
  dates.forEach(date => {
    baseData.forEach(m => {
      const randomVariance = Math.floor(Math.random() * 20) - 10;
      rows.push([date, m.name, String(m.baseOrders + randomVariance), String(m.baseAds > 0 ? m.baseAds + (randomVariance * 1000) : 0)]);
    });
  });
  return rows;
};

// Caching Memory Global
const globalCache = {};
const globalPromises = {}; 

export function useSheetData(endpoint = 'getDashboard') {
  const [data, setData] = useState(globalCache[endpoint] || null);
  const [isLoading, setIsLoading] = useState(!globalCache[endpoint]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (globalCache[endpoint]) {
      setData(globalCache[endpoint]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      const isLocalDev = import.meta.env.DEV;

      if (isLocalDev) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (endpoint === 'getDashboard') return createMockDatabase();
        if (endpoint === 'getHistoris') return createMockHistoris();
        if (endpoint === 'getRawDaily') return createMockDaily();
        return [];
      }

      const response = await fetch(`/api/${endpoint}?t=${Date.now()}`);
      if (!response.ok) throw new Error(`Gagal menarik data ${endpoint}`);
      const result = await response.json();
      return result.data || result;
    };

    // Safe Promise Sharing (Mencegah kerusakan akibat StrictMode Abort)
    if (!globalPromises[endpoint]) {
      globalPromises[endpoint] = fetchData()
        .then((resData) => {
          globalCache[endpoint] = resData;
          return resData;
        })
        .catch((err) => {
          delete globalPromises[endpoint]; // Hapus cache promise jika gagal agar bisa coba lagi
          throw err;
        });
    }

    setIsLoading(true);
    globalPromises[endpoint]
      .then((resData) => {
        setData(resData);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat data');
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [endpoint]);

  return { data, isLoading, error };
}