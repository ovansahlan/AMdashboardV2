import React, { useMemo, useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList, PieChart, Pie, Cell } from 'recharts';
import { ShoppingCart, Megaphone, Coins, Award, Store, Wallet, Loader2, AlertCircle, Filter, Activity, PieChart as PieIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ==========================================
// 1. HELPER FUNCTIONS 
// ==========================================
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);
};

// Menambahkan awalan "Rp" agar label di atas batang juga ikut format Rupiah
const formatShorthand = (num) => {
  if (!num || num === 0) return 'Rp 0';
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `Rp ${(num / 1e3).toFixed(0)}K`;
  return `Rp ${num}`;
};

const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '' || val === '#N/A') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/Rp/g, '').trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

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

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
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

      totalBasketSize += bs; 
      totalInvestment += mi; 
      totalAdsSpent += ads; 
      totalCampaignPoints += pts;

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

      let cleanName = mexName.split('-')[0].split(',')[0].trim();
      if (cleanName.length > 12) {
        cleanName = cleanName.substring(0, 12) + '...';
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
      { name: 'GMS & Local', value: campaignStats.gmsLocal, color: '#00B14F' },
      { name: 'GMS Only', value: campaignStats.gmsOnly, color: '#00D05E' },
      { name: 'Local Only', value: campaignStats.localOnly, color: '#FF7A00' },
      { name: 'Zero Campaign', value: campaignStats.zero, color: '#E5E7EB' }
    ].filter(d => d.value > 0);

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

  // ==========================================
  // 3. UI RENDERERS
  // ==========================================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50">
        <Loader2 className="animate-spin text-[#00B14F] mb-4" size={40} />
        <p className="text-slate-600 font-semibold tracking-wide">Memuat Data GrabFood...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
        <AlertCircle size={24} />
        <p className="font-medium">Data tidak valid atau gagal ditarik: {error}</p>
      </div>
    );
  }

  const { kpis, health, donutData, charts } = metrics;

  // CUSTOM BAR TOOLTIP (Menampilkan Rp dan Badge Persentase Tren)
  const CompareTooltip = ({ active, payload, label, accentColor }) => {
    if (active && payload && payload.length >= 2) {
      const lmValue = payload[0].value;
      const mtdValue = payload[1].value;
      
      let growthPct = 0;
      if (lmValue > 0) {
        growthPct = ((mtdValue - lmValue) / lmValue) * 100;
      } else if (lmValue === 0 && mtdValue > 0) {
        growthPct = 100;
      }

      return (
        <div className="bg-white text-slate-800 text-[11px] p-3.5 rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.15)] border border-slate-100 space-y-2.5 min-w-[200px] outline-none">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-2 truncate">{label}</p>
          <div className="flex justify-between items-center text-slate-500">
            <span>Bulan Lalu:</span>
            <span className="font-mono font-semibold text-slate-400">{formatRupiah(lmValue)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-800 font-bold">
            <span>Bulan Ini:</span>
            <span className="font-mono text-sm" style={{ color: accentColor || '#00B14F' }}>{formatRupiah(mtdValue)}</span>
          </div>
          
          {/* Badge Tren Naik/Turun */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-1">
            <span className="text-slate-400 text-[9px] uppercase tracking-wider font-semibold">Tren:</span>
            {growthPct >= 0 ? (
              <span className="text-[#00B14F] font-bold flex items-center text-[10px] bg-[#E5F7ED] px-2 py-1 rounded-md">
                <TrendingUp size={12} className="mr-1"/> +{growthPct.toFixed(1)}% Naik
              </span>
            ) : (
              <span className="text-[#E02424] font-bold flex items-center text-[10px] bg-red-50 px-2 py-1 rounded-md">
                <TrendingDown size={12} className="mr-1"/> {growthPct.toFixed(1)}% Turun
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // CUSTOM DONUT TOOLTIP
  const DonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dt = payload[0].payload;
      return (
        <div className="bg-white text-slate-800 text-[11px] p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[140px] outline-none">
          <div className="flex items-center gap-2 mb-1.5 border-b border-slate-100 pb-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dt.color }}></span>
            <span className="font-bold text-slate-800">{dt.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Total:</span>
            <span className="font-mono font-bold text-slate-900">{dt.value} Toko</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans space-y-6">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#00B14F] rounded-xl flex items-center justify-center">
            <Store size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Ringkasan Performa Merchant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
          <Filter size={18} className="text-[#00B14F]" />
          <span className="text-sm font-semibold text-slate-600">AM:</span>
          <select
            value={selectedAm}
            onChange={(e) => setSelectedAm(e.target.value)}
            className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {amList.map((am) => (
              <option key={am} value={am}>
                {am === 'All' ? 'All AM' : am}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- 6 KPI CARDS --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <ShoppingCart size={16} className="text-[#00B14F]" />
            <span className="text-xs font-bold uppercase tracking-wider">Basket Size</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 truncate">{kpis.basketSizeStr}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Coins size={16} className="text-[#00B14F]" />
            <span className="text-xs font-bold uppercase tracking-wider">Investment</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 truncate">{kpis.investmentStr}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Megaphone size={16} className="text-[#FF7A00]" />
            <span className="text-xs font-bold uppercase tracking-wider">Ads Spent</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 truncate">{kpis.adsSpentStr}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Store size={16} className="text-[#00B14F]" />
            <span className="text-xs font-bold uppercase tracking-wider">Active Toko</span>
          </div>
          <h3 className="text-lg font-black text-slate-900">{kpis.activeMerchants}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Wallet size={16} className="text-[#00B14F]" />
            <span className="text-xs font-bold uppercase tracking-wider">MCA Disburse</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 truncate">{kpis.mcaDisbursedStr}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Award size={16} className="text-[#00B14F]" />
            <span className="text-xs font-bold uppercase tracking-wider">Camp Points</span>
          </div>
          <h3 className="text-lg font-black text-slate-900">{kpis.campaignPointsStr}</h3>
        </div>
      </div>

      {/* --- ROW 1: BAR CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: SALES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-6">
            <h4 className="text-base font-black text-slate-900">Top 10 Basketsize</h4>
            <p className="text-xs text-slate-500">Bulan Lalu vs Bulan Ini</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topSales} margin={{ top: 40, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} dy={10} angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis hide type="number" />
                <Tooltip content={<CompareTooltip accentColor="#00B14F" />} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                
                {/* activeBar={false} dan outline: none untuk menghilangkan kotak hitam (focus) */}
                <Bar dataKey="salesLM" name="Bulan Lalu" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={16} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="salesLM" position="top" formatter={formatShorthand} style={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold', outline: 'none' }} offset={8} />
                </Bar>
                <Bar dataKey="sales" name="Bulan Ini" fill="#00B14F" radius={[4, 4, 0, 0]} barSize={16} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="sales" position="top" formatter={formatShorthand} style={{ fontSize: 10, fill: '#00B14F', fontWeight: '900', outline: 'none' }} offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: ADS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-6">
            <h4 className="text-base font-black text-slate-900">Top 10 Ads Spender</h4>
            <p className="text-xs text-slate-500">Alokasi Biaya Promosi</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topAds} margin={{ top: 40, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} dy={10} angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis hide type="number" />
                <Tooltip content={<CompareTooltip accentColor="#FF7A00" />} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                
                <Bar dataKey="adsLM" name="Bulan Lalu" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={16} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="adsLM" position="top" formatter={formatShorthand} style={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold', outline: 'none' }} offset={8} />
                </Bar>
                <Bar dataKey="ads" name="Bulan Ini" fill="#FF7A00" radius={[4, 4, 0, 0]} barSize={16} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="ads" position="top" formatter={formatShorthand} style={{ fontSize: 10, fill: '#FF7A00', fontWeight: '900', outline: 'none' }} offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- ROW 2: HEALTH & CAMPAIGN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* HEALTH STATUS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-6 border-b border-slate-100 pb-4 flex items-center gap-3">
            <div className="p-2 bg-[#E5F7ED] rounded-xl"><Activity size={20} className="text-[#00B14F]"/></div>
            <div>
              <h4 className="text-base font-black text-slate-900">Merchant Health</h4>
              <p className="text-xs text-slate-500">Performa pertumbuhan toko bulan ini.</p>
            </div>
          </div>
          
          <div className="space-y-6 flex-1 flex flex-col justify-center">
             {/* GROWING */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[#00B14F] font-bold text-sm flex items-center gap-2"><TrendingUp size={18}/> Toko Bertumbuh (Naik)</span>
                   <span className="text-slate-900 font-black text-base">{health.grow} <span className="text-slate-400 font-medium text-xs ml-1">({health.growPct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                   <div className="bg-[#00B14F] h-3 rounded-full" style={{ width: `${health.growPct}%` }}></div>
                </div>
             </div>
             
             {/* STABLE */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-600 font-bold text-sm flex items-center gap-2"><Minus size={18}/> Toko Stabil (Tetap)</span>
                   <span className="text-slate-900 font-black text-base">{health.stable} <span className="text-slate-400 font-medium text-xs ml-1">({health.stablePct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                   <div className="bg-slate-400 h-3 rounded-full" style={{ width: `${health.stablePct}%` }}></div>
                </div>
             </div>
             
             {/* DECLINING */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-red-500 font-bold text-sm flex items-center gap-2"><TrendingDown size={18}/> Toko Menurun (Drop)</span>
                   <span className="text-slate-900 font-black text-base">{health.drop} <span className="text-slate-400 font-medium text-xs ml-1">({health.dropPct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                   <div className="bg-red-500 h-3 rounded-full" style={{ width: `${health.dropPct}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* CAMPAIGN PIE CHART */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-6 border-b border-slate-100 pb-4 flex items-center gap-3">
            <div className="p-2 bg-[#FFF2E5] rounded-xl"><PieIcon size={20} className="text-[#FF7A00]"/></div>
            <div>
              <h4 className="text-base font-black text-slate-900">Campaign Mix</h4>
              <p className="text-xs text-slate-500">Distribusi partisipasi promo toko.</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {/* activeShape={false} dan style outline:none untuk hilangkan outline hitam */}
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  activeShape={false}
                  style={{ outline: 'none' }}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}