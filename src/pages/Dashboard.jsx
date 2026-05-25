import React, { useMemo } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShoppingCart, Megaphone, Coins, Award, Store, Wallet, Loader2, AlertCircle } from 'lucide-react';

// 🛠️ HELPER FORMATTER
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);
};

const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '' || val === '#N/A') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/Rp/g, '').trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

export default function Dashboard() {
  const { data, isLoading, error } = useSheetData('getDashboard');

  // 🧠 CORE PARSING ENGINE: Menghitung 6 KPI Dan Menyusun Top 10 Charts
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    let totalBasketSize = 0;
    let totalInvestment = 0;
    let totalAdsSpent = 0;
    let totalCampaignPoints = 0;
    let activeMerchantCount = 0;
    let totalMcaDisbursed = 0;

    const merchantRankings = [];

    // Looping data asli (Melewati baris-baris kosong/header awal)
    data.forEach((row) => {
      const mexName = row[4]; // Kolom E (Index 4)
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A') return;

      // Extract nilai mentah dari kolom target
      const bs = parseNumber(row[19]);   // Kolom T: MTD (BS)
      const mi = parseNumber(row[23]);   // Kolom X: MTD (MI)
      const ads = parseNumber(row[31]);  // Kolom AF: Total MTD (Ads)
      const pts = parseNumber(row[45]);  // Kolom AT: Total Point Campaign
      
      const mcaStatus = row[39] ? row[39].toString().toLowerCase().trim() : ''; // Kolom AN
      const mcaDate = row[40] ? row[40].toString().toLowerCase().trim() : '';   // Kolom AO
      const mcaAmount = parseNumber(row[41]);                                  // Kolom AP

      // 1. Akumulasi KPI Dasar
      totalBasketSize += bs;
      totalInvestment += mi;
      totalAdsSpent += ads;
      totalCampaignPoints += pts;

      // 2. Hitung Merchant Aktif (Transaksi MTD > 0)
      if (bs > 0) {
        activeMerchantCount++;
      }

      // 3. Hitung MCA Disbursed Khusus Bulan Berjalan (May-26 atau mengandung kata 'may' / 'mei')
      if (mcaStatus === 'disbursed' && (mcaDate.includes('may') || mcaDate.includes('mei') || mcaDate.includes('-05-'))) {
        totalMcaDisbursed += mcaAmount;
      }

      // Simpan untuk keperluan perankingan chart
      merchantRankings.push({
        name: mexName.split('-')[0].trim(), // Ambil nama depan saja agar teks chart ringkas
        sales: bs,
        ads: ads,
        investment: mi
      });
    });

    // Urutkan Top 10 Descending
    const topSales = [...merchantRankings].sort((a, b) => b.sales - a.sales).slice(0, 10);
    const topAds = [...merchantRankings].sort((a, b) => b.ads - a.ads).slice(0, 10);
    const topInvestment = [...merchantRankings].sort((a, b) => b.investment - a.investment).slice(0, 10);

    return {
      kpis: {
        basketSizeStr: formatRupiah(totalBasketSize),
        investmentStr: formatRupiah(totalInvestment),
        adsSpentStr: formatRupiah(totalAdsSpent),
        campaignPointsStr: totalCampaignPoints.toLocaleString('id-ID'),
        activeMerchants: activeMerchantCount.toLocaleString('id-ID'),
        mcaDisbursedStr: formatRupiah(totalMcaDisbursed)
      },
      charts: { topSales, topAds, topInvestment }
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-slate-900" size={32} />
        <p className="text-sm font-medium animate-pulse tracking-wide">Mengkalkulasi Rapor Sheet C-BS...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex gap-3 text-sm">
        <AlertCircle size={20} className="shrink-0" />
        <div><b>Gagal Sinkronisasi:</b> {error || 'Struktur data tidak valid'}.</div>
      </div>
    );
  }

  const { kpis, charts } = metrics;

  // Custom Formatter Tooltip Chart
  const RupiahTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 text-white text-xs p-2 rounded-lg shadow-xl border border-slate-800">
          <p className="font-semibold text-slate-400 mb-0.5">{label}</p>
          <p className="font-bold text-white">{formatRupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Main Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">Real-time agregasi matriks komersial seluruh Account Manager (AM).</p>
      </div>

      {/* 📊 GRID 6 KARTU KPI UTAMA (Enterprise Grid Responsive) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        
        {/* KPI 1: Total Basket Size */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">MTD Basket Size</span>
            <ShoppingCart size={16} className="text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-950 tracking-tight mt-2 truncate">{kpis.basketSizeStr}</h3>
        </div>

        {/* KPI 2: Total Investment */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Investment</span>
            <Coins size={16} className="text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-950 tracking-tight mt-2 truncate">{kpis.investmentStr}</h3>
        </div>

        {/* KPI 3: Total Ads Spent */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Ads MTD</span>
            <Megaphone size={16} className="text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-950 tracking-tight mt-2 truncate">{kpis.adsSpentStr}</h3>
        </div>

        {/* KPI 4: Total Campaign Points */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Campaign Points</span>
            <Award size={16} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-slate-950 tracking-tight mt-2">{kpis.campaignPointsStr} <span className="text-xs font-medium text-slate-400">Pts</span></h3>
        </div>

        {/* KPI 5: Active Merchants */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Merchant</span>
            <Store size={16} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-slate-950 tracking-tight mt-2">{kpis.activeMerchants} <span className="text-xs font-medium text-slate-400">Mex</span></h3>
        </div>

        {/* KPI 6: MCA Disbursed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">MCA Disbursed MTD</span>
            <Wallet size={16} className="text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-950 tracking-tight mt-2 truncate">{kpis.mcaDisbursedStr}</h3>
        </div>

      </div>

      {/* 📈 SEKSI CHART TOP 10 RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Chart 1: Top 10 Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Top 10 Merchant Sales MTD</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topSales} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="sales" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top 10 Ads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Top 10 Ads Spender</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topAds} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="ads" fill="#475569" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top 10 Investment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Top 10 Merchant Investment</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topInvestment} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="investment" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}