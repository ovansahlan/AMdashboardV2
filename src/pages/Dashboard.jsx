import React, { useMemo, useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { ShoppingCart, Megaphone, Coins, Award, Store, Wallet, Loader2, AlertCircle, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// 🛠️ HELPER FORMATTER
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);
};

// Formatter Singkatan Akurat untuk Label Grafik (Misal: 59.9M, 381K agar hemat tempat di HP)
const formatShorthand = (num) => {
  if (!num || num === 0) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return `${num}`;
};

const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '' || val === '#N/A') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/Rp/g, '').trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

export default function Dashboard() {
  const { data, isLoading, error } = useSheetData('getDashboard');
  const [selectedAm, setSelectedAm] = useState('All');

  // 🧠 ENGINE 1: Ekstrak Daftar Nama AM Unik
  const amList = useMemo(() => {
    if (!data || data.length === 0) return ['All'];
    const uniqueAms = new Set();
    data.forEach((row) => {
      const amName = row[2]; // Kolom C
      const mexName = row[4]; // Kolom E
      if (amName && amName !== 'AM Name' && amName.trim() !== '' && mexName && mexName !== 'Mex Name') {
        uniqueAms.add(amName.trim());
      }
    });
    return ['All', ...Array.from(uniqueAms).sort()];
  }, [data]);

  // 🧠 ENGINE 2: Agregasi 6 KPI & Komparasi Data Chart (MTD vs LM)
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    let totalBasketSize = 0;
    let totalInvestment = 0;
    let totalAdsSpent = 0;
    let totalCampaignPoints = 0;
    let activeMerchantCount = 0;
    let totalMcaDisbursed = 0;

    const merchantRankings = [];

    data.forEach((row) => {
      const mexName = row[4]; // Kolom E
      const amName = row[2] ? row[2].toString().trim() : ''; // Kolom C
      
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A') return;

      // Filter AM
      if (selectedAm !== 'All' && amName !== selectedAm) return;

      const bs = parseNumber(row[19]);     // Kolom T: MTD (BS)
      const bsLM = parseNumber(row[18]);   // Kolom S: Apr-26 (BS LM)
      const mi = parseNumber(row[23]);     // Kolom X: MTD (MI)
      const ads = parseNumber(row[31]);    // Kolom AF: Total MTD (Ads)
      const adsLM = parseNumber(row[30]);  // Kolom AE: Apr-26 (Ads LM)
      const pts = parseNumber(row[45]);    // Kolom AT: Total Point Campaign
      
      const mcaStatus = row[39] ? row[39].toString().toLowerCase().trim() : ''; 
      const mcaDate = row[40] ? row[40].toString().toLowerCase().trim() : '';   
      const mcaAmount = parseNumber(row[41]);                                  

      totalBasketSize += bs;
      totalInvestment += mi;
      totalAdsSpent += ads;
      totalCampaignPoints += pts;

      if (bs > 0) activeMerchantCount++;

      if (mcaStatus === 'disbursed' && (mcaDate.includes('may') || mcaDate.includes('mei') || mcaDate.includes('-05-'))) {
        totalMcaDisbursed += mcaAmount;
      }

      // Potong nama merchant ekstra pendek agar muat berjajar kesamping di layar HP
      const cleanName = mexName.split('-')[0].split(',')[0].trim().substring(0, 10);

      merchantRankings.push({
        name: cleanName,
        sales: bs,
        salesLM: bsLM,
        ads: ads,
        adsLM: adsLM
      });
    });

    const topSales = [...merchantRankings].sort((a, b) => b.sales - a.sales).slice(0, 10);
    const topAds = [...merchantRankings].sort((a, b) => b.ads - a.ads).slice(0, 10);

    return {
      kpis: {
        basketSizeStr: formatRupiah(totalBasketSize),
        investmentStr: formatRupiah(totalInvestment),
        adsSpentStr: formatRupiah(totalAdsSpent),
        campaignPointsStr: totalCampaignPoints.toLocaleString('id-ID'),
        activeMerchants: activeMerchantCount.toLocaleString('id-ID'),
        mcaDisbursedStr: formatRupiah(totalMcaDisbursed)
      },
      charts: { topSales, topAds }
    };
  }, [data, selectedAm]);

  if (isLoading) {
    return (
      <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-slate-900" size={32} />
        <p className="text-sm font-medium animate-pulse">Mengoptimalkan tampilan mobile dashboard...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex gap-3 text-sm">
        <AlertCircle size={20} className="shrink-0" />
        <div><b>Gagal Sinkronisasi:</b> {error || 'Struktur data tidak valid'}.</div>
      </div>
    );
  }

  const { kpis, charts } = metrics;

  const CompareTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length >= 2) {
      const lmValue = payload[0].value;
      const mtdValue = payload[1].value;
      let growthPct = 0;
      if (lmValue > 0) growthPct = ((mtdValue - lmValue) / lmValue) * 100;

      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white text-[11px] p-3 rounded-xl shadow-2xl border border-slate-800 space-y-2 min-w-[180px]">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 truncate">{label}</p>
          <div className="flex justify-between items-center text-slate-400">
            <span>LM:</span>
            <span className="font-mono font-semibold text-slate-300">{formatRupiah(lmValue)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-200 font-bold">
            <span>MTD:</span>
            <span className="font-mono text-emerald-400">{formatRupiah(mtdValue)}</span>
          </div>
          <div className="pt-1 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[9px]">Growth:</span>
            {growthPct >= 0 ? (
              <span className="text-emerald-400 font-bold flex items-center text-[10px]">
                +{growthPct.toFixed(1)}%
              </span>
            ) : (
              <span className="text-red-400 font-bold flex items-center text-[10px]">
                {growthPct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4 sm:pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">Main Dashboard Overview</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Analisis Month-to-Date vs Bulan Lalu.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg shadow-xs self-start sm:self-center">
          <Filter size={12} className="text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-500">AM:</span>
          <select
            value={selectedAm}
            onChange={(e) => setSelectedAm(e.target.value)}
            className="text-[11px] font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {amList.map((am) => (
              <option key={am} value={am}>
                {am === 'All' ? 'All AMs' : am}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📊 GRID 6 KARTU KPI UTAMA (Dioptimalkan: Kunci 2 Kolom di HP!) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-5">
        
        {/* KPI 1 */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">MTD Basket Size</span>
            <ShoppingCart size={14} className="text-slate-400 shrink-0" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight mt-1 truncate">{kpis.basketSizeStr}</h3>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Investment</span>
            <Coins size={14} className="text-slate-400 shrink-0" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight mt-1 truncate">{kpis.investmentStr}</h3>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Ads MTD</span>
            <Megaphone size={14} className="text-slate-400 shrink-0" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight mt-1 truncate">{kpis.adsSpentStr}</h3>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Campaign Points</span>
            <Award size={14} className="text-slate-400 shrink-0" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight mt-1">{kpis.campaignPointsStr} <span className="text-[10px] font-normal text-slate-400">Pts</span></h3>
        </div>

        {/* KPI 5 */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Active Merchant</span>
            <Store size={14} className="text-slate-400 shrink-0" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight mt-1">{kpis.activeMerchants} <span className="text-[10px] font-normal text-slate-400">Mex</span></h3>
        </div>

        {/* KPI 6 */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">MCA Disbursed</span>
            <Wallet size={14} className="text-slate-400 shrink-0" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight mt-1 truncate">{kpis.mcaDisbursedStr}</h3>
        </div>

      </div>

      {/* 📈 GRAFIK BERJAJER KE SAMPING DENGAN DIRECT VALUE LABELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pt-2">
        
        {/* 1. CHART TOP 10 BASKET SIZE */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top 10 Merchant Basket Size (Sales)</h4>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Nilai tertera langsung di atas bar grafik.</p>
          </div>
          <div className="h-[280px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topSales} margin={{ top: 20, bottom: 25, left: -25, right: 10 }}>
                <defs>
                  <linearGradient id="salesLmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#f1f5f9" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="salesMtdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#334155" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                {/* Kemiringan teks di HP diatur -45 derajat agar muat & tidak tabrakan */}
                <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} dy={6} angle={-45} textAnchor="end" height={45} />
                <YAxis hide type="number" />
                <Tooltip content={<CompareTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.4 }} />
                <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={5} wrapperStyle={{ fontSize: '10px' }} />
                
                {/* Batang LM */}
                <Bar dataKey="salesLM" name="LM" fill="url(#salesLmGrad)" radius={[2, 2, 0, 0]} barSize={10}>
                  <LabelList dataKey="salesLM" position="top" formatter={formatShorthand} style={{ fontSize: 7, fill: '#94a3b8', fontWeight: 'bold' }} offset={4} />
                </Bar>
                
                {/* Batang MTD */}
                <Bar dataKey="sales" name="MTD" fill="url(#salesMtdGrad)" radius={[2, 2, 0, 0]} barSize={10}>
                  <LabelList dataKey="sales" position="top" formatter={formatShorthand} style={{ fontSize: 8, fill: '#0f172a', fontWeight: 'black' }} offset={4} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. CHART TOP 10 ADS SPENDER */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top 10 Merchant Ads Spender</h4>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Komparasi alokasi biaya iklan tanpa sentuh popup.</p>
          </div>
          <div className="h-[280px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topAds} margin={{ top: 20, bottom: 25, left: -25, right: 10 }}>
                <defs>
                  <linearGradient id="adsLmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#f8fafc" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="adsMtdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} dy={6} angle={-45} textAnchor="end" height={45} />
                <YAxis hide type="number" />
                <Tooltip content={<CompareTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.4 }} />
                <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={5} wrapperStyle={{ fontSize: '10px' }} />
                
                {/* Batang LM */}
                <Bar dataKey="adsLM" name="LM" fill="url(#adsLmGrad)" radius={[2, 2, 0, 0]} barSize={10}>
                  <LabelList dataKey="adsLM" position="top" formatter={formatShorthand} style={{ fontSize: 7, fill: '#94a3b8', fontWeight: 'bold' }} offset={4} />
                </Bar>
                
                {/* Batang MTD */}
                <Bar dataKey="ads" name="MTD" fill="url(#adsMtdGrad)" radius={[2, 2, 0, 0]} barSize={10}>
                  <LabelList dataKey="ads" position="top" formatter={formatShorthand} style={{ fontSize: 8, fill: '#334155', fontWeight: 'black' }} offset={4} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}