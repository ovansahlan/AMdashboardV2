import React, { useMemo, useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList, PieChart, Pie, Cell } from 'recharts';
import { ShoppingCart, Megaphone, Coins, Award, Store, Wallet, Loader2, AlertCircle, Filter, ArrowUpRight, ArrowDownRight, Activity, PieChart as PieIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// 🛠️ HELPER FORMATTER
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);
};

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

// 🧠 ENGINE LOGIKA PARSING CAMPAIGN
const parseCampaign = (val) => {
  if (!val || typeof val !== 'string' || val.trim() === '' || val === '0' || val === '-' || val.toLowerCase().includes('no campaign') || val === '#n/a') {
    return 'Zero Campaign';
  }
  const str = val.toLowerCase();
  const hasGMS = str.includes('gms booster') || str.includes('gms cuan');
  const parts = str.split('|').map(s => s.trim()).filter(s => s !== '');
  const hasLocal = parts.some(p => !p.includes('gms booster') && !p.includes('gms cuan'));

  if (hasGMS && hasLocal) return 'GMS & Local';
  if (hasGMS && !hasLocal) return 'GMS Only';
  if (!hasGMS && hasLocal) return 'Local Only';
  return 'Zero Campaign';
};

export default function Dashboard() {
  const { data, isLoading, error } = useSheetData('getDashboard');
  const [selectedAm, setSelectedAm] = useState('All');

  const amList = useMemo(() => {
    if (!data || data.length === 0) return ['All'];
    const uniqueAms = new Set();
    data.forEach((row) => {
      const amName = row[2];
      const mexName = row[4];
      if (amName && amName !== 'AM Name' && amName.trim() !== '' && mexName && mexName !== 'Mex Name') {
        uniqueAms.add(amName.trim());
      }
    });
    return ['All', ...Array.from(uniqueAms).sort()];
  }, [data]);

  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    let totalBasketSize = 0, totalInvestment = 0, totalAdsSpent = 0;
    let totalCampaignPoints = 0, activeMerchantCount = 0, totalMcaDisbursed = 0;
    let health = { grow: 0, stable: 0, drop: 0, total: 0 };
    let campaignStats = { gmsOnly: 0, gmsLocal: 0, localOnly: 0, zero: 0 };

    const merchantRankings = [];

    data.forEach((row) => {
      const mexName = row[4];
      const amName = row[2] ? row[2].toString().trim() : '';
      
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A') return;
      if (selectedAm !== 'All' && amName !== selectedAm) return;

      const bs = parseNumber(row[19]);
      const bsLM = parseNumber(row[18]);
      const rrBs = parseNumber(row[20]);
      const mi = parseNumber(row[23]);
      const ads = parseNumber(row[31]);
      const adsLM = parseNumber(row[30]);
      const pts = parseNumber(row[45]);
      
      const mcaStatus = row[39] ? row[39].toString().toLowerCase().trim() : ''; 
      const mcaDate = row[40] ? row[40].toString().toLowerCase().trim() : '';   
      const mcaAmount = parseNumber(row[41]);                                  
      const campaignVal = row[44];         

      totalBasketSize += bs; totalInvestment += mi; totalAdsSpent += ads; totalCampaignPoints += pts;

      if (bs > 0) activeMerchantCount++;

      if (mcaStatus === 'disbursed' && (mcaDate.includes('may') || mcaDate.includes('mei') || mcaDate.includes('-05-'))) {
        totalMcaDisbursed += mcaAmount;
      }

      if (bsLM > 0) {
        health.total++;
        if (rrBs > bsLM * 1.05) health.grow++;
        else if (rrBs < bsLM * 0.95) health.drop++;
        else health.stable++;
      }

      const campType = parseCampaign(campaignVal);
      if (campType === 'GMS Only') campaignStats.gmsOnly++;
      else if (campType === 'GMS & Local') campaignStats.gmsLocal++;
      else if (campType === 'Local Only') campaignStats.localOnly++;
      else campaignStats.zero++;

      // 🛠️ PEMOTONGAN NAMA PINTAR DENGAN ELLIPSIS (...)
      let cleanName = mexName.split('-')[0].split(',')[0].trim();
      if (cleanName.length > 15) {
        cleanName = cleanName.substring(0, 15) + '...';
      }

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

    const donutData = [
      { name: 'GMS & Local', value: campaignStats.gmsLocal, color: '#f59e0b' },
      { name: 'GMS Only', value: campaignStats.gmsOnly, color: '#3b82f6' },
      { name: 'Local Only', value: campaignStats.localOnly, color: '#10b981' },
      { name: 'Zero Campaign', value: campaignStats.zero, color: '#cbd5e1' }
    ].filter(d => d.value > 0);

    // Hitung Persentase Health
    health.growPct = health.total ? Math.round((health.grow / health.total) * 100) : 0;
    health.stablePct = health.total ? Math.round((health.stable / health.total) * 100) : 0;
    health.dropPct = health.total ? Math.round((health.drop / health.total) * 100) : 0;

    return {
      kpis: {
        basketSizeStr: formatRupiah(totalBasketSize),
        investmentStr: formatRupiah(totalInvestment),
        adsSpentStr: formatRupiah(totalAdsSpent),
        campaignPointsStr: totalCampaignPoints.toLocaleString('id-ID'),
        activeMerchants: activeMerchantCount.toLocaleString('id-ID'),
        mcaDisbursedStr: formatRupiah(totalMcaDisbursed)
      },
      health,
      donutData,
      charts: { topSales, topAds }
    };
  }, [data, selectedAm]);

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-slate-900" size={32} />
        <p className="text-sm font-medium animate-pulse">Menyusun layout komprehensif...</p>
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

  const { kpis, health, donutData, charts } = metrics;

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
            <span className="font-mono text-white">{formatRupiah(mtdValue)}</span>
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

  const DonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dt = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white text-[11px] p-3 rounded-xl shadow-xl border border-slate-800 min-w-[130px]">
          <div className="flex items-center gap-2 mb-1.5 border-b border-slate-800 pb-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dt.color }}></span>
            <span className="font-bold text-slate-200">{dt.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total:</span>
            <span className="font-mono text-emerald-400 font-bold">{dt.value} Mex</span>
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
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Analisis Komprehensif MTD vs LM & Distribusi Campaign.</p>
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

      {/* 📊 GRID 6 KARTU KPI UTAMA (DIPERBAIKI: lg:grid-cols-6 agar di tablet/preview tetap 1 baris) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[100px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">MTD Basket Size</span>
            <ShoppingCart size={14} className="shrink-0" />
          </div>
          <h3 className="text-sm sm:text-lg font-black text-slate-950 tracking-tight mt-1 truncate">{kpis.basketSizeStr}</h3>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[100px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Investment</span>
            <Coins size={14} className="shrink-0" />
          </div>
          <h3 className="text-sm sm:text-lg font-black text-slate-950 tracking-tight mt-1 truncate">{kpis.investmentStr}</h3>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[100px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Ads MTD</span>
            <Megaphone size={14} className="shrink-0" />
          </div>
          <h3 className="text-sm sm:text-lg font-black text-slate-950 tracking-tight mt-1 truncate">{kpis.adsSpentStr}</h3>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[100px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Active Merchant</span>
            <Store size={14} className="shrink-0" />
          </div>
          <h3 className="text-sm sm:text-lg font-black text-slate-950 tracking-tight mt-1">{kpis.activeMerchants} <span className="text-[10px] font-normal text-slate-400">Mex</span></h3>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[100px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">MCA Disbursed</span>
            <Wallet size={14} className="shrink-0" />
          </div>
          <h3 className="text-sm sm:text-lg font-black text-slate-950 tracking-tight mt-1 truncate">{kpis.mcaDisbursedStr}</h3>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[85px] sm:min-h-[100px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Campaign Points</span>
            <Award size={14} className="shrink-0" />
          </div>
          <h3 className="text-sm sm:text-lg font-black text-slate-950 tracking-tight mt-1">{kpis.campaignPointsStr} <span className="text-[10px] font-normal text-slate-400">Pts</span></h3>
        </div>
      </div>

      {/* 📈 GRAFIK ROW 1: TOP 10 CHARTS (DIPERBAIKI: md:grid-cols-2 agar bersisian di layar medium) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
        
        {/* 1. CHART TOP 10 BASKET SIZE */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top 10 Basketsize</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Komparasi nilai transaksi MTD vs LM.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topSales} margin={{ top: 20, bottom: 25, left: -25, right: 10 }}>
                <defs>
                  <linearGradient id="salesLmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#dbeafe" stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="salesMtdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} dy={10} angle={-45} textAnchor="end" height={60} />
                <YAxis hide type="number" />
                <Tooltip content={<CompareTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.4 }} />
                <Legend verticalAlign="top" align="right" height={30} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', fontWeight: '500' }} />
                
                <Bar dataKey="salesLM" name="LM" fill="url(#salesLmGrad)" radius={[3, 3, 0, 0]} barSize={14}>
                  <LabelList dataKey="salesLM" position="top" formatter={formatShorthand} style={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} offset={4} />
                </Bar>
                <Bar dataKey="sales" name="MTD" fill="url(#salesMtdGrad)" radius={[3, 3, 0, 0]} barSize={14}>
                  <LabelList dataKey="sales" position="top" formatter={formatShorthand} style={{ fontSize: 9, fill: '#1e3a8a', fontWeight: 'black' }} offset={4} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. CHART TOP 10 ADS SPENDER */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top 10 Ads Spender</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Komparasi alokasi biaya iklan.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topAds} margin={{ top: 20, bottom: 25, left: -25, right: 10 }}>
                <defs>
                  <linearGradient id="adsLmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fde047" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#fef08a" stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="adsMtdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#c2410c" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} dy={10} angle={-45} textAnchor="end" height={60} />
                <YAxis hide type="number" />
                <Tooltip content={<CompareTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.4 }} />
                <Legend verticalAlign="top" align="right" height={30} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', fontWeight: '500' }} />
                
                <Bar dataKey="adsLM" name="LM" fill="url(#adsLmGrad)" radius={[3, 3, 0, 0]} barSize={14}>
                  <LabelList dataKey="adsLM" position="top" formatter={formatShorthand} style={{ fontSize: 8, fill: '#854d0e', fontWeight: 'bold' }} offset={4} />
                </Bar>
                <Bar dataKey="ads" name="MTD" fill="url(#adsMtdGrad)" radius={[3, 3, 0, 0]} barSize={14}>
                  <LabelList dataKey="ads" position="top" formatter={formatShorthand} style={{ fontSize: 9, fill: '#7c2d12', fontWeight: 'black' }} offset={4} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 📊 GRAFIK ROW 2: HEALTH & CAMPAIGN (DIPERBAIKI: md:grid-cols-2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
        
        {/* 1. WIDGET: MERCHANT HEALTH STATUS */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><Activity size={14} className="text-slate-700"/> Merchant Health Status</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Performa Runrate bulan berjalan vs pencapaian Bulan Lalu (LM).</p>
          </div>
          
          <div className="space-y-6 flex-1 flex flex-col justify-center px-1">
             {/* GROWING */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5"><TrendingUp size={14}/> Growing (&gt; 5%)</span>
                   <span className="text-slate-800 font-black text-sm">{health.grow} <span className="text-slate-400 font-medium text-[10px] ml-1">Mex ({health.growPct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                   <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${health.growPct}%` }}></div>
                </div>
             </div>
             
             {/* STABLE */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-500 font-bold text-xs flex items-center gap-1.5"><Minus size={14}/> Stable (± 5%)</span>
                   <span className="text-slate-800 font-black text-sm">{health.stable} <span className="text-slate-400 font-medium text-[10px] ml-1">Mex ({health.stablePct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                   <div className="bg-slate-400 h-2.5 rounded-full" style={{ width: `${health.stablePct}%` }}></div>
                </div>
             </div>
             
             {/* DECLINING */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-red-500 font-bold text-xs flex items-center gap-1.5"><TrendingDown size={14}/> Declining (&lt; 5%)</span>
                   <span className="text-slate-800 font-black text-sm">{health.drop} <span className="text-slate-400 font-medium text-[10px] ml-1">Mex ({health.dropPct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                   <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${health.dropPct}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* 2. DONUT CHART: CAMPAIGN JOINERS */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><PieIcon size={14}/> Campaign Distribution</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Klasifikasi partisipasi campaign aktif berjalan.</p>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', fontWeight: '500', color: '#475569' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}