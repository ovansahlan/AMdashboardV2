import React, { useMemo, useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShoppingCart, Megaphone, Coins, Award, Store, Wallet, Loader2, AlertCircle, Filter } from 'lucide-react';

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
  
  // ⚡ STATE UNTUK FILTER AM (Default: 'All' untuk menampilkan semua data)
  const [selectedAm, setSelectedAm] = useState('All');

  // 🧠 ENGINE 1: Ekstrak Daftar Nama AM Unik Secara Otomatis dari Kolom C (Index 2)
  const amList = useMemo(() => {
    if (!data || data.length === 0) return ['All'];
    
    const uniqueAms = new Set();
    data.forEach((row) => {
      const amName = row[2]; // Kolom C: AM Name
      const mexName = row[4]; // Kolom E: Mex Name
      
      // Validasi agar header sheet atau baris kosong tidak masuk ke list filter
      if (amName && amName !== 'AM Name' && amName.trim() !== '' && mexName && mexName !== 'Mex Name') {
        uniqueAms.add(amName.trim());
      }
    });

    // Kembalikan opsi 'All' di urutan pertama, diikuti nama-nama AM hasil sorting abjad
    return ['All', ...Array.from(uniqueAms).sort()];
  }, [data]);

  // 🧠 ENGINE 2: Core Parsing & Kalkulasi KPI/Chart (Sudah disaring berdasarkan AM terpilih)
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
      const mexName = row[4]; // Kolom E: Mex Name
      const amName = row[2] ? row[2].toString().trim() : ''; // Kolom C: AM Name
      
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A') return;

      // ⚡ KONDISI FILTER: Jika user memilih AM tertentu, lewati baris merchant milik AM lain
      if (selectedAm !== 'All' && amName !== selectedAm) return;

      // Extract nilai finansial
      const bs = parseNumber(row[19]);   // Kolom T: MTD (BS)
      const mi = parseNumber(row[23]);   // Kolom X: MTD (MI)
      const ads = parseNumber(row[31]);  // Kolom AF: Total MTD (Ads)
      const pts = parseNumber(row[45]);  // Kolom AT: Total Point Campaign
      
      const mcaStatus = row[39] ? row[39].toString().toLowerCase().trim() : ''; 
      const mcaDate = row[40] ? row[40].toString().toLowerCase().trim() : '';   
      const mcaAmount = parseNumber(row[41]);                                  

      // Akumulasi KPI
      totalBasketSize += bs;
      totalInvestment += mi;
      totalAdsSpent += ads;
      totalCampaignPoints += pts;

      if (bs > 0) activeMerchantCount++;

      if (mcaStatus === 'disbursed' && (mcaDate.includes('may') || mcaDate.includes('mei') || mcaDate.includes('-05-'))) {
        totalMcaDisbursed += mcaAmount;
      }

      merchantRankings.push({
        name: mexName.split('-')[0].trim(),
        sales: bs,
        ads: ads,
        investment: mi
      });
    });

    // Urutkan Top 10 Descending hasil filter
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
  }, [data, selectedAm]); // ⚡ Re-run engine otomatis setiap kali 'selectedAm' berubah

  if (isLoading) {
    return (
      <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-slate-900" size={32} />
        <p className="text-sm font-medium animate-pulse tracking-wide">Menyaring portfolio data AM...</p>
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
      
      {/* HEADER SECTION DENGAN DROPDOWN FILTER AM */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Main Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time agregasi matriks komersial berdasarkan penugasan Account Manager.</p>
        </div>
        
        {/* 🎛️ SELECT BOX DROP DOWN FILTER */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-xs self-start sm:self-center focus-within:border-slate-400 transition-all">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 mr-1">AM:</span>
          <select
            value={selectedAm}
            onChange={(e) => setSelectedAm(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer pr-4"
          >
            {amList.map((am) => (
              <option key={am} value={am}>
                {am === 'All' ? 'All Account Managers' : am}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📊 GRID 6 KARTU KPI UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">MTD Basket Size</span>
            <ShoppingCart size={16} className="text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-950 tracking-tight mt-2 truncate">{kpis.basketSizeStr}</h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Investment</span>
            <Coins size={16} className="text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-950 tracking-tight mt-2 truncate">{kpis.investmentStr}</h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Ads MTD</span>
            <Megaphone size={16} className="text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-950 tracking-tight mt-2 truncate">{kpis.adsSpentStr}</h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Campaign Points</span>
            <Award size={16} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-slate-950 tracking-tight mt-2">{kpis.campaignPointsStr} <span className="text-xs font-medium text-slate-400">Pts</span></h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Merchant</span>
            <Store size={16} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-slate-950 tracking-tight mt-2">{kpis.activeMerchants} <span className="text-xs font-medium text-slate-400">Mex</span></h3>
        </div>

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