import React, { useMemo } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShoppingCart, Megaphone, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

// 🛠️ HELPER: Format Angka ke Rupiah Indonesia
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// 🛠️ HELPER: Pembersih Angka (Mengubah "59,950,583" menjadi 59950583)
const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/\./g, '').replace(/Rp/g, '').trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

export default function Dashboard() {
  const { data, isLoading, error } = useSheetData('getDashboard');

  // 🧠 ENGINE PARSING & KALKULASI DATA (Berjalan otomatis tanpa re-render berlebih)
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { kpis: {}, chartsData: [] };

    let totalSales = 0;
    let totalAds = 0;
    let totalMCA = 0;
    const merchantList = [];

    // Loop setiap baris data dari Google Sheet
    data.forEach((row) => {
      const mexName = row[4]; // Kolom E: Mex Name

      // Skip baris yang kosong atau header yang nyasar
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A') return; 

      // Tarik data berdasarkan peta index CSV Anda
      const sales = parseNumber(row[19]);  // Kolom T: MTD (BS)
      const ads = parseNumber(row[31]);    // Kolom AF: Total MTD (Ads)
      const mca = parseNumber(row[41]);    // Kolom AP: MCA Amount
      const sucIncome = parseNumber(row[27]); // Kolom AB: SUC (MI)

      // Tambahkan ke Total KPI Global
      totalSales += sales;
      totalAds += ads;
      totalMCA += mca;

      // Masukkan ke daftar Merchant untuk di-ranking nanti
      merchantList.push({
        name: mexName,
        sales: sales,
        ads: ads,
        sucIncome: sucIncome
      });
    });

    // Kalkulasi Top 10 secara Descending (Terbesar ke Terkecil)
    const topSales = [...merchantList].sort((a, b) => b.sales - a.sales).slice(0, 10);
    const topAds = [...merchantList].sort((a, b) => b.ads - a.ads).slice(0, 10);
    const topSuc = [...merchantList].sort((a, b) => b.sucIncome - a.sucIncome).slice(0, 10);

    return {
      kpis: {
        basketsize: formatRupiah(totalSales),
        adsSpent: formatRupiah(totalAds),
        mcaAmount: formatRupiah(totalMCA),
      },
      chartsData: { topSales, topAds, topSuc }
    };
  }, [data]);

  // --- STATE LOADING ---
  if (isLoading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-slate-900" size={32} />
        <p className="text-sm font-medium tracking-wide animate-pulse">Menghubungkan ke Google Sheet Anda...</p>
      </div>
    );
  }

  // --- STATE ERROR ---
  if (error) {
    return (
      <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
        <AlertCircle size={20} className="shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">Gagal Sinkronisasi Data</h4>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { kpis, chartsData } = processedData;

  // Custom Tooltip Recharts agar angkanya berformat Rupiah
  const RupiahTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs p-2 rounded-md shadow-lg border border-slate-700">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-slate-300">{formatRupiah(payload[0].value)}</p>
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
        <p className="text-slate-500 text-sm mt-0.5">Ringkasan performa KPI utama dan matriks Top 10 Merchant (Data Live).</p>
      </div>

      {/* 📊 KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-200">
            <ShoppingCart size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Basketsize (Sales)</p>
            <h3 className="text-xl font-bold text-slate-950 mt-0.5">{kpis.basketsize || 'Rp 0'}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-200">
            <Megaphone size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ads Spent</p>
            <h3 className="text-xl font-bold text-slate-950 mt-0.5">{kpis.adsSpent || 'Rp 0'}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-200">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total MCA Amount</p>
            <h3 className="text-xl font-bold text-slate-950 mt-0.5">{kpis.mcaAmount || 'Rp 0'}</h3>
          </div>
        </div>
      </div>

      {/* 📈 CHARTS GRID (Telah Diurutkan Berdasarkan Nilai Tertinggi) */}
      {chartsData.topSales && chartsData.topSales.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Top 10 Sales */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900">Top 10 Sales MTD</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Diurutkan berdasarkan Basketsize terbesar.</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.topSales} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="sales" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Top 10 Ads Spender */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900">Top 10 Ads Spender</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Merchant dengan pengeluaran iklan tertinggi.</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.topAds} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="ads" fill="#475569" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Top 10 SUC (MI) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900">Top 10 Success Income (SUC)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Pendapatan sukses tertinggi (pengganti orders).</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.topSuc} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="sucIncome" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}