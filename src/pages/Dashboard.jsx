import React, { useMemo, useContext } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList, PieChart, Pie, Cell } from 'recharts';
import { ShoppingCart, Megaphone, Coins, Award, Store, Wallet, Loader2, AlertCircle, Filter, Activity, PieChart as PieIcon, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);
};

const formatShorthandNum = (num) => {
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
  const { selectedAm, setSelectedAm } = useContext(GlobalFilterContext);

  // ⚡ ENGINE 1: Deteksi Last Update dan Bulan Berjalan dari Spreadsheet
  const { lastUpdateText, reportDate } = useMemo(() => {
    let text = "Data Live";
    let date = new Date(); // Fallback ke hari ini
    if (data && data.length > 0) {
      // Cari di 5 baris pertama saja untuk mempercepat proses
      for (let i = 0; i < Math.min(5, data.length); i++) {
        for (let j = 0; j < data[i].length; j++) {
          const cell = data[i][j];
          if (typeof cell === 'string' && (cell.toLowerCase().includes('update') || cell.toLowerCase().includes('tanggal'))) {
            text = cell;
            // Coba ekstrak tanggal yang ada di dalam teks (Contoh: "Last Update: 09 June 2026")
            const match = cell.match(/\d{1,2}\s+[a-zA-Z]+\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/);
            if (match) {
              const parsed = Date.parse(match[0]);
              if (!isNaN(parsed)) date = new Date(parsed);
            }
            break;
          }
        }
        if (text !== "Data Live") break;
      }
    }
    return { lastUpdateText: text, reportDate: date };
  }, [data]);

  const amList = useMemo(() => {
    if (!data || data.length === 0) return ['All'];
    const uniqueAms = new Set();
    data.forEach((row) => {
      const amName = row[2];
      const mexName = row[4];
      if (amName && amName !== 'AM Name' && amName.trim() !== '' && !amName.toLowerCase().includes('update') && mexName && mexName !== 'Mex Name') {
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

    // Persiapan logika kalender MCA (Mencocokkan dengan Bulan & Tahun Last Update)
    const targetMonth = reportDate.getMonth();
    const targetYear = reportDate.getFullYear();
    const monthNamesEn = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthNamesId = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
    const numFormat1 = `-${String(targetMonth + 1).padStart(2, '0')}-`;
    const numFormat2 = `/${String(targetMonth + 1).padStart(2, '0')}/`;

    // ⚡ Logika Validasi Bulan MCA
    const isCurrentReportingMonth = (dStr) => {
      if (!dStr || dStr === '-' || dStr === '0') return false;
      const parsed = Date.parse(dStr);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      }
      const lower = dStr.toLowerCase();
      return lower.includes(monthNamesEn[targetMonth]) || lower.includes(monthNamesId[targetMonth]) || lower.includes(numFormat1) || lower.includes(numFormat2);
    };

    data.forEach((row) => {
      const mexName = row[4];
      const amName = row[2] ? row[2].toString().trim() : '';
      
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A' || mexName.toString().toLowerCase().includes('update')) return;
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

      // ⚡ CALCULATOR MCA DINAMIS
      if (
        (mcaStatus.includes('disbursed') || mcaStatus.includes('pending disbursed')) && 
        isCurrentReportingMonth(mcaDate)
      ) {
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
        salesRR: rrBs,
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
  }, [data, selectedAm, reportDate]);

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

  const CompareTooltip = ({ active, payload, label, accentColor, useRunrate }) => {
    if (active && payload && payload.length >= 2) {
      const lmValue = payload[0].value;
      const mtdValue = payload[1].value;
      const targetCompareValue = useRunrate ? payload[0].payload.salesRR : mtdValue;
      
      let growthPct = 0;
      if (lmValue > 0) {
        growthPct = ((targetCompareValue - lmValue) / lmValue) * 100;
      } else if (lmValue === 0 && targetCompareValue > 0) {
        growthPct = 100;
      }

      return (
        <div className="bg-white/95 backdrop-blur-md text-slate-800 p-4 rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[240px] outline-none flex flex-col gap-3 z-50">
          <div className="border-b border-slate-100 pb-2">
            <p className="font-black text-slate-900 text-[13px] truncate">{label}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Bulan Lalu</span>
              <span className="font-mono font-bold text-slate-400">{formatRupiah(lmValue)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-bold">Bulan Ini (MTD)</span>
              <span className="font-mono font-black" style={{ color: accentColor || '#00B14F' }}>{formatRupiah(mtdValue)}</span>
            </div>
            {useRunrate && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Proyeksi (RR)</span>
                <span className="font-mono font-bold text-slate-700">{formatRupiah(targetCompareValue)}</span>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              {useRunrate ? 'Tren vs Runrate' : 'Tren vs Bulan Lalu'}
            </span>
            {growthPct >= 0 ? (
              <span className="text-[#00B14F] font-bold flex items-center text-xs bg-[#E5F7ED] px-2.5 py-1 rounded-lg">
                <TrendingUp size={14} className="mr-1"/> +{growthPct.toFixed(1)}%
              </span>
            ) : (
              <span className="text-[#E02424] font-bold flex items-center text-xs bg-red-50 px-2.5 py-1 rounded-lg">
                <TrendingDown size={14} className="mr-1"/> {growthPct.toFixed(1)}%
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
        <div className="bg-white/95 backdrop-blur-md text-slate-800 p-3.5 rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[160px] outline-none">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
            <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: dt.color }}></span>
            <span className="font-bold text-slate-800 text-xs">{dt.name}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total:</span>
            <span className="font-mono font-bold text-slate-900 text-[13px]">{dt.value} Toko</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-3 sm:space-y-6 -mx-2 sm:mx-0">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00B14F] rounded-xl flex items-center justify-center shrink-0">
            <Store size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
            
            {/* ⚡ MENAMPILKAN LAST UPDATE SEBAGAI BADGE */}
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Ringkasan Performa Merchant</p>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="text-[9px] sm:text-[10px] bg-[#E5F7ED] text-[#00B14F] px-2 py-0.5 rounded border border-[#00B14F]/20 font-bold flex items-center gap-1">
                <Clock size={10} /> {lastUpdateText}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl w-full sm:w-auto">
          <Filter size={16} className="text-[#00B14F] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-600 shrink-0">AM:</span>
          <select
            value={selectedAm}
            onChange={(e) => setSelectedAm(e.target.value)}
            className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer w-full"
          >
            {amList.map((am) => (
              <option key={am} value={am}>{am === 'All' ? 'Semua AM' : am}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- 6 KPI CARDS --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-center">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center hover:border-[#00B14F] transition-all cursor-default">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 sm:mb-2">
            <ShoppingCart size={14} className="text-[#00B14F]" />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Basket Size</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate w-full">{kpis.basketSizeStr}</h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center hover:border-[#00B14F] transition-all cursor-default">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 sm:mb-2">
            <Coins size={14} className="text-[#00B14F]" />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Investment</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate w-full">{kpis.investmentStr}</h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center hover:border-[#FF7A00] transition-all cursor-default">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 sm:mb-2">
            <Megaphone size={14} className="text-[#FF7A00]" />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Ads Spent</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate w-full">{kpis.adsSpentStr}</h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center hover:border-[#00B14F] transition-all cursor-default">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 sm:mb-2">
            <Store size={14} className="text-[#00B14F]" />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Active Toko</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900">{kpis.activeMerchants}</h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center hover:border-[#00B14F] transition-all cursor-default">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 sm:mb-2">
            <Wallet size={14} className="text-[#00B14F]" />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">MCA Disburse</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate w-full">{kpis.mcaDisbursedStr}</h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center hover:border-[#00B14F] transition-all cursor-default">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 sm:mb-2">
            <Award size={14} className="text-[#00B14F]" />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Camp Points</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900">{kpis.campaignPointsStr}</h3>
        </div>
      </div>

      {/* --- ROW 1: BAR CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* CHART 1: SALES */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="mb-4 sm:mb-6 w-full text-center border-b border-slate-100 pb-3 sm:pb-4">
            <h4 className="text-sm sm:text-base font-black text-slate-900">Top 10 Basket Size</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Bulan Lalu vs Bulan Ini</p>
          </div>
          <div className="h-[250px] sm:h-[350px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topSales} margin={{ top: 30, right: 0, left: 0, bottom: 20 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={9} tickLine={false} axisLine={false} dy={10} angle={-45} textAnchor="end" height={60} interval={0} padding={{ left: 15, right: 15 }} />
                <YAxis hide type="number" />
                <Tooltip content={<CompareTooltip accentColor="#00B14F" useRunrate={true} />} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="top" align="center" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                
                <Bar dataKey="salesLM" name="Bulan Lalu" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={12} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="salesLM" position="top" angle={-90} offset={15} formatter={formatShorthandNum} style={{ fontSize: 8, fill: '#6B7280', fontWeight: 'bold', outline: 'none' }} />
                </Bar>
                <Bar dataKey="sales" name="Bulan Ini" fill="#00B14F" radius={[4, 4, 0, 0]} barSize={12} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="sales" position="top" angle={-90} offset={15} formatter={formatShorthandNum} style={{ fontSize: 9, fill: '#00B14F', fontWeight: '900', outline: 'none' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: ADS */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="mb-4 sm:mb-6 w-full text-center border-b border-slate-100 pb-3 sm:pb-4">
            <h4 className="text-sm sm:text-base font-black text-slate-900">Top 10 Ads Spender</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Alokasi Biaya Promosi</p>
          </div>
          <div className="h-[250px] sm:h-[350px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topAds} margin={{ top: 30, right: 0, left: 0, bottom: 20 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={9} tickLine={false} axisLine={false} dy={10} angle={-45} textAnchor="end" height={60} interval={0} padding={{ left: 15, right: 15 }} />
                <YAxis hide type="number" />
                <Tooltip content={<CompareTooltip accentColor="#FF7A00" useRunrate={false} />} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="top" align="center" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                
                <Bar dataKey="adsLM" name="Bulan Lalu" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={12} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="adsLM" position="top" angle={-90} offset={15} formatter={formatShorthandNum} style={{ fontSize: 8, fill: '#6B7280', fontWeight: 'bold', outline: 'none' }} />
                </Bar>
                <Bar dataKey="ads" name="Bulan Ini" fill="#FF7A00" radius={[4, 4, 0, 0]} barSize={12} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="ads" position="top" angle={-90} offset={15} formatter={formatShorthandNum} style={{ fontSize: 9, fill: '#FF7A00', fontWeight: '900', outline: 'none' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- ROW 2: HEALTH & CAMPAIGN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* HEALTH STATUS */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-4 sm:mb-6 border-b border-slate-100 pb-3 sm:pb-4 flex flex-col items-center text-center">
            <div className="p-2 sm:p-2.5 bg-[#E5F7ED] rounded-lg sm:rounded-xl mb-2 sm:mb-3"><Activity size={18} className="text-[#00B14F] sm:w-[22px] sm:h-[22px]"/></div>
            <h4 className="text-sm sm:text-base font-black text-slate-900">Merchant Health Status</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Performa Runrate vs Target Bulan Lalu.</p>
          </div>
          
          <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col justify-center px-2 sm:px-4">
             <div>
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                   <span className="text-[#00B14F] font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"><TrendingUp size={14} className="sm:w-[18px] sm:h-[18px]"/> Bertumbuh (Naik)</span>
                   <span className="text-slate-900 font-black text-sm sm:text-base">{health.grow} <span className="text-slate-400 font-medium text-[10px] sm:text-xs ml-1">({health.growPct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3">
                   <div className="bg-[#00B14F] h-2.5 sm:h-3 rounded-full transition-all duration-500" style={{ width: `${health.growPct}%` }}></div>
                </div>
             </div>
             
             <div>
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                   <span className="text-slate-600 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"><Minus size={14} className="sm:w-[18px] sm:h-[18px]"/> Stabil (Tetap)</span>
                   <span className="text-slate-900 font-black text-sm sm:text-base">{health.stable} <span className="text-slate-400 font-medium text-[10px] sm:text-xs ml-1">({health.stablePct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3">
                   <div className="bg-slate-400 h-2.5 sm:h-3 rounded-full transition-all duration-500" style={{ width: `${health.stablePct}%` }}></div>
                </div>
             </div>
             
             <div>
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                   <span className="text-red-500 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"><TrendingDown size={14} className="sm:w-[18px] sm:h-[18px]"/> Menurun (Drop)</span>
                   <span className="text-slate-900 font-black text-sm sm:text-base">{health.drop} <span className="text-slate-400 font-medium text-[10px] sm:text-xs ml-1">({health.dropPct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3">
                   <div className="bg-red-500 h-2.5 sm:h-3 rounded-full transition-all duration-500" style={{ width: `${health.dropPct}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* CAMPAIGN PIE CHART */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="mb-4 sm:mb-6 w-full text-center border-b border-slate-100 pb-3 sm:pb-4 flex flex-col items-center">
            <div className="p-2 sm:p-2.5 bg-[#FFF2E5] rounded-lg sm:rounded-xl mb-2 sm:mb-3"><PieIcon size={18} className="text-[#FF7A00] sm:w-[22px] sm:h-[22px]"/></div>
            <h4 className="text-sm sm:text-base font-black text-slate-900">Campaign Mix</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Distribusi partisipasi promo toko aktif.</p>
          </div>
          
          <div className="h-[220px] sm:h-[280px] w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
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
                <Legend verticalAlign="bottom" align="center" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}