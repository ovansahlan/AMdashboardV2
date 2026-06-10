import React, { useState, useMemo, useContext } from 'react'; 
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../context/GlobalContext'; 
import { BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { Loader2, AlertCircle, Award, Store, UserCircle, Megaphone, ShoppingCart, Clock, CheckCircle2, TrendingUp, MonitorPlay, Users, Percent, DollarSign, ChevronRight, Activity } from 'lucide-react';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);

const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '' || val === '#N/A') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/Rp/g, '').replace('%', '').trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

const safeParseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0);
  let cleanStr = dateStr.trim().toLowerCase().replace('januari', 'january').replace('februari', 'february').replace('maret', 'march').replace('mei', 'may').replace('juni', 'june').replace('juli', 'july').replace('agustus', 'august').replace('oktober', 'october').replace('desember', 'december');
  if (cleanStr === '-' || cleanStr === '0' || cleanStr === '#n/a' || cleanStr === 'n/a' || cleanStr === '') return new Date(0);
  const parsed = Date.parse(cleanStr);
  return isNaN(parsed) ? new Date(0) : new Date(parsed);
};

export default function MerchantPresentation() {
  const { data: dashboardData, isLoading: loadDash, error: errDash } = useSheetData('getDashboard');
  const { data: historisData, isLoading: loadHist, error: errHist } = useSheetData('getHistoris');

  const { selectedAm } = useContext(GlobalFilterContext); 
  const [selectedMex, setSelectedMex] = useState('');

  const merchantOptions = useMemo(() => {
    if (!dashboardData || !Array.isArray(dashboardData)) return [];
    const list = [];
    dashboardData.forEach((row) => {
      const name = row[4];
      const amName = row[2] ? row[2].toString().trim() : '';
      if (selectedAm !== 'All' && amName !== selectedAm) return;
      if (name && name !== 'Mex Name' && !name.toLowerCase().includes('update') && name !== '#N/A') {
        list.push({ id: row[3] || name, name: name.toString().trim(), fullName: name });
      }
    });
    return list;
  }, [dashboardData, selectedAm]);

  React.useEffect(() => {
    if (merchantOptions.length > 0) {
      const looksFound = merchantOptions.some(m => m.fullName === selectedMex);
      if (!looksFound) setSelectedMex(merchantOptions[0].fullName);
    } else setSelectedMex('');
  }, [merchantOptions, selectedMex]);

  const profile = useMemo(() => {
    if (!selectedMex || !dashboardData || !historisData) return null;

    // --- 1. MAPPING DASHBOARD (MTD Current) ---
    const dashRow = dashboardData.find(r => r[4] === selectedMex);
    let bsMTD = 0, amName = 'Unassigned', mexId = '-', campaignRaw = '';
    if (dashRow) {
      amName = dashRow[2]; mexId = dashRow[3];
      bsMTD = parseNumber(dashRow[19]);
      campaignRaw = dashRow[44] || ''; 
    }

    // --- 2. MAPPING HISTORIS 6 BULAN PER MEX ---
    let historyChart = [], lastAov = 0, lastPromoUsage = '-', lastOnlineHours = 0;
    
    if (Array.isArray(historisData) && historisData.length > 1) {
      const myHistoryRows = historisData.filter(r => {
        const rowName = r[3] ? r[3].toString().trim() : '';
        const rowId = r[2] ? r[2].toString().trim() : '';
        return rowName === selectedMex || rowId === mexId;
      });
      
      myHistoryRows.sort((a, b) => safeParseDate(a[1]) - safeParseDate(b[1]));

      historyChart = myHistoryRows.map(row => {
        const dateObj = safeParseDate(row[1]);
        const monthLabel = dateObj.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

        // Tarik Kolom Berdasarkan Spesifikasi Pemetaan Anda
        const completedOrders = parseNumber(row[5]);    // F: Completed Orders
        const totalOrders = parseNumber(row[6]);        // G: Total Orders
        const promoOrders = parseNumber(row[7]);        // H: Orders with Promo/MFC
        const basketSize = parseNumber(row[9]);         // J: Basket Size
        const mfp = parseNumber(row[10]);                // K: MFP
        const mfc = parseNumber(row[11]);                // L: MFC
        const cpo = parseNumber(row[12]);                // M: CPO
        const gms = parseNumber(row[13]);                // N: GMS
        const baseComm = parseNumber(row[14]);           // O: Basic Commission
        const aov = parseNumber(row[15]);                // P: AOV
        const adsMobile = parseNumber(row[16]);          // Q: Ads Mobile
        const adsWeb = parseNumber(row[17]);             // R: Ads Web
        const adsDirect = parseNumber(row[18]);          // S: Direct Ads
        const photoPenetration = row[28] ? row[28].toString().trim() : '-'; // AC: Photo Penetration
        const onlineHours = parseNumber(row[29]);        // AD: Online Hours

        // Hitung Persentase Promo Usage secara Real (Promo Orders / Total Orders)
        const promoUsageRate = totalOrders > 0 ? Math.round((promoOrders / totalOrders) * 100) : 0;

        // Finansial Kalkulasi
        const totalAds = adsMobile + adsWeb + adsDirect;
        const merchantInvestment = mfp + mfc + totalAds + cpo + gms + baseComm;
        const netSales = basketSize - merchantInvestment;

        // Simpan nilai rekap terbaru untuk kartu highlight di atas
        lastAov = aov;
        lastPromoUsage = `${promoUsageRate}%`;
        lastOnlineHours = onlineHours;

        return {
          month: monthLabel,
          basketSize,
          merchantInvestment,
          netSales,
          completedOrders,
          totalOrders,
          aov,
          promoUsageRate,
          onlineHours,
          photoPenetration
        };
      });
    }

    return { cleanName: selectedMex.toString().trim(), mexId, amName, bsMTD, campaignRaw, aov: lastAov, promoUsage: lastPromoUsage, onlineHours: lastOnlineHours, historyChart };
  }, [selectedMex, dashboardData, historisData]);

  const isLoading = loadDash || loadHist;
  const anyError = errDash || errHist;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] items-center gap-3">
        <Loader2 className="animate-spin text-[#00B14F]" size={40} />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Menyusun Struktur Dashboard Pitching...</p>
      </div>
    );
  }

  if (anyError) return <div className="p-4 m-4 bg-red-50 text-red-700 font-bold rounded-xl text-xs flex items-center gap-2"><AlertCircle size={16} /><span>Gagal memuat data: {anyError.toString()}</span></div>;

  // TOOLTIP FINANSIAL 6 BULAN
  const HistoryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const invPct = data.basketSize > 0 ? ((data.merchantInvestment / data.basketSize) * 100).toFixed(1) : 0;
      const netPct = data.basketSize > 0 ? ((data.netSales / data.basketSize) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 min-w-[240px]">
          <p className="font-black text-slate-900 text-[13px] text-center border-b border-slate-100 pb-2 mb-3">Periode: {label}</p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#00B14F] font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00B14F]"></div> Net Sales ({netPct}%)</span>
              <span className="font-mono font-black text-[#00B14F]">{formatRupiah(data.netSales)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#FF7A00] font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF7A00]"></div> Total Investment ({invPct}%)</span>
              <span className="font-mono font-black text-[#FF7A00]">{formatRupiah(data.merchantInvestment)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold">Total Basket Size</span>
              <span className="font-mono font-black text-slate-900">{formatRupiah(data.basketSize)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // TOOLTIP ORDER PERFORMANCE
  const OrderTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length >= 2) {
      const total = payload[0].value;
      const completed = payload[1].value;
      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-2">
          <p className="font-black text-slate-900 border-b pb-1 text-center">{label}</p>
          <div className="flex justify-between gap-4"><span>Total Masuk:</span><span className="font-bold">{total} Order</span></div>
          <div className="flex justify-between gap-4 text-[#00B14F]"><span>Selesai (Completed):</span><span className="font-black">{completed} Order</span></div>
          <div className="pt-1.5 border-t text-center font-bold text-slate-500">Rasio Penyelesaian: <span className="text-blue-600 font-black">{completionRate}%</span></div>
        </div>
      );
    }
    return null;
  };

  // TOOLTIP AOV & PROMO
  const AovTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const aovVal = payload[0].value;
      const promoVal = payload[1] ? payload[1].value : 0;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-2">
          <p className="font-black text-slate-900 border-b pb-1 text-center">{label}</p>
          <div className="flex justify-between gap-4 text-[#FF7A00]"><span>AOV (Nilai Tiket):</span><span className="font-mono font-black">{formatRupiah(aovVal)}</span></div>
          <div className="flex justify-between gap-4 text-emerald-600"><span>Rasio Order Promo:</span><span className="font-black">{promoVal}%</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-4 sm:space-y-6 -mx-2 sm:mx-0 select-none [&_*]:outline-none">
      
      {/* HEADER BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-4 relative mx-2 sm:mx-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00B14F] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#00B14F]/10">
            <MonitorPlay size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900">Pitching Deck Mode</h1>
            <p className="text-[10px] sm:text-xs font-bold text-[#00B14F] uppercase tracking-wider">Presentasi Kinerja Partner</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl w-full lg:w-[400px] lg:absolute lg:left-1/2 lg:-translate-x-1/2 focus-within:border-[#00B14F] transition-colors shadow-sm">
          <Store size={16} className="text-[#00B14F] shrink-0" />
          <select value={selectedMex} onChange={(e) => setSelectedMex(e.target.value)} className="text-xs sm:text-sm font-black text-slate-800 bg-transparent outline-none cursor-pointer w-full truncate text-center [text-align-last:center]">
            {merchantOptions.length === 0 ? <option value="">Tidak ada merchant</option> : merchantOptions.map(m => <option key={m.id} value={m.fullName}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {profile ? (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          
          {/* TOP CORE CARD SUMMARY HIGHLIGHT */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mx-2 sm:mx-0">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-[#E5F7ED] text-[#00B14F] rounded-xl shrink-0"><ShoppingCart size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Basket MTD</span><p className="text-sm sm:text-base font-black text-slate-900">{formatRupiah(profile.bsMTD)}</p></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-[#FFF2E5] text-[#FF7A00] rounded-xl shrink-0"><DollarSign size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block">AOV Terakhir</span><p className="text-sm sm:text-base font-black text-slate-900">{formatRupiah(profile.aov)}</p></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Percent size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Rasio Promo</span><p className="text-sm sm:text-base font-black text-slate-900">{profile.promoUsage}</p></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Clock size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Jam Aktif Bulanan</span><p className="text-sm sm:text-base font-black text-slate-900">{profile.onlineHours} Jam</p></div>
            </div>
          </div>

          {/* ⚡ CHART 1: HISTORI FINANSIAL & INVESTMENT */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 mx-2 sm:mx-0">
            <div className="mb-6 border-b border-slate-100 pb-3 text-center">
              <h4 className="text-sm sm:text-base font-black text-slate-900">Performa Finansial 6 Bulan Terakhir</h4>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Komparasi Penjualan Bersih (Net Sales) vs Total Investasi Toko (Comm, Promo, Ads)</p>
            </div>
            
            {profile.historyChart && profile.historyChart.length > 0 ? (
              <div className="h-[250px] sm:h-[320px] w-full flex justify-center select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={profile.historyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<HistoryTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '15px' }} />
                    <Bar dataKey="netSales" name="Net Sales" stackId="a" fill="#00B14F" radius={[0, 0, 4, 4]} barSize={36} />
                    <Bar dataKey="merchantInvestment" name="Total Investment" stackId="a" fill="#FF7A00" radius={[4, 4, 0, 0]} barSize={36} />
                    <Line type="monotone" dataKey="basketSize" name="Gross Basket Size" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="p-8 text-center text-slate-400 italic text-xs">Data tidak tersedia.</div>}
          </div>

          {/* GRID LAYOUT UNTUK 3 GRAFIK BARU REQUEST ANDA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mx-2 sm:mx-0">
            
            {/* ⚡ CHART 2: TOTAL ORDERS VS COMPLETED ORDERS */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-4 border-b border-slate-100 pb-3 text-center">
                <h4 className="text-sm sm:text-base font-black text-slate-900">Efisiensi Order Bulanan</h4>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Perbandingan Total Order Masuk vs Pesanan Selesai (Completed)</p>
              </div>
              <div className="h-[230px] sm:h-[260px] w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profile.historyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<OrderTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="totalOrders" name="Total Orders" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={14} />
                    <Bar dataKey="completedOrders" name="Completed Orders" fill="#00B14F" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ⚡ CHART 3: AOV VS PROMO USAGE MIX */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-4 border-b border-slate-100 pb-3 text-center">
                <h4 className="text-sm sm:text-base font-black text-slate-900">Korelasi AOV & Rasio Promo</h4>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Melihat pengaruh partisipasi promo terhadap nilai rata-rata belanja tiket (AOV)</p>
              </div>
              <div className="h-[230px] sm:h-[260px] w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={profile.historyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<AovTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    {/* Bar Mewakili Nilai Rupiah AOV */}
                    <Bar dataKey="aov" name="AOV (Rupiah)" fill="#FF7A00" radius={[4, 4, 0, 0]} barSize={24} />
                    {/* Line Mewakili Tren Persentase Penggunaan Promo */}
                    <Line type="monotone" dataKey="promoUsageRate" name="Promo Usage (%)" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ⚡ CHART 4: ONLINE HOURS ACCUMULATION */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
              <div className="mb-4 border-b border-slate-100 pb-3 text-center">
                <h4 className="text-sm sm:text-base font-black text-slate-900">Konsistensi Jam Operasional Toko</h4>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Total durasi jam buka toko aktif (Online Hours) secara akumulatif per bulan</p>
              </div>
              <div className="h-[200px] sm:h-[240px] w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profile.historyChart} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(value) => [`${value} Jam`, 'Online Hours']} />
                    <Line type="monotone" dataKey="onlineHours" name="Jam Buka Aktif" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }}>
                      <LabelList dataKey="onlineHours" position="top" formatter={(v) => `${v}h`} style={{ fill: '#3B82F6', fontSize: 10, fontWeight: '900' }} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ACCOUNT PROFILE METADATA FOOTER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mx-2 sm:mx-0">
            <div className="bg-white p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3"><UserCircle size={18} className="text-[#00B14F]" /><h4 className="font-black text-slate-900 text-sm">Profil Akun Partner</h4></div>
              <div className="space-y-3 text-xs flex-1 flex flex-col justify-center">
                <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-400 font-bold">Nama Outlet:</span><span className="font-black text-slate-800 text-right">{profile.cleanName}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-400 font-bold">Merchant ID:</span><span className="font-mono font-bold text-slate-700">{profile.mexId}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400 font-bold">Manager:</span><span className="font-bold text-emerald-600">{profile.amName}</span></div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 md:col-span-2 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3"><Award size={18} className="text-[#FF7A00]" /><h4 className="font-black text-slate-900 text-sm">Program Promosi Aktif</h4></div>
              <div className="flex flex-wrap gap-2 flex-1 items-center">
                {profile.campaignRaw && profile.campaignRaw !== '-' && profile.campaignRaw !== '0' ? (
                  profile.campaignRaw.split('|').filter(c => c && c.trim() !== '').map((c, i) => <span key={i} className="px-3 py-2 bg-[#E5F7ED] text-[#00B14F] border border-[#00B14F]/10 text-xs font-black rounded-xl">✅ {c.trim()}</span>)
                ) : <span className="text-slate-400 italic text-xs">Tidak ada program promosi aktif dari dashboard utama.</span>}
              </div>
            </div>
          </div>
          
        </div>
      ) : <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs font-bold italic mx-2 sm:mx-0">Silakan pilih merchant untuk memulai presentasi.</div>}
    </div>
  );
}