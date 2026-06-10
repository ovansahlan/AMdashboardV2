import React, { useState, useMemo, useContext } from 'react'; 
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../context/GlobalContext'; 
import { BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { Loader2, AlertCircle, Award, Store, UserCircle, Megaphone, ShoppingCart, Clock, CheckCircle2, TrendingUp, MonitorPlay, Users, Percent, DollarSign } from 'lucide-react';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);

const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '' || val === '#N/A') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/Rp/g, '').trim();
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
  const { data: dailyData, isLoading: loadDaily, error: errDaily } = useSheetData('getRawDaily');

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
    if (!selectedMex || !dashboardData || !historisData || !dailyData) return null;

    // --- 1. MAPPING DASHBOARD (MTD Current) ---
    const dashRow = dashboardData.find(r => r[4] === selectedMex);
    let bsMTD = 0, amName = 'Unassigned', mexId = '-', campaignRaw = '';
    if (dashRow) {
      amName = dashRow[2]; mexId = dashRow[3];
      bsMTD = parseNumber(dashRow[19]);
      campaignRaw = dashRow[44] || ''; 
    }

    // --- 2. MAPPING HISTORIS 6 BULAN (Format Baru) ---
    let historyChart = [], aov = 0;
    if (Array.isArray(historisData) && historisData.length > 1) {
      // Ambil baris milik merchant ini saja
      const myHistoryRows = historisData.filter(r => r[3] === selectedMex || r[2] === mexId);
      
      // Urutkan berdasarkan kolom tanggal (B / Index 1) dari paling lama ke terbaru
      myHistoryRows.sort((a, b) => safeParseDate(a[1]) - safeParseDate(b[1]));

      historyChart = myHistoryRows.map(row => {
        const dateObj = safeParseDate(row[1]);
        const monthLabel = dateObj.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

        // Mapping Data sesuai panduan kolom Anda
        const basketSize = parseNumber(row[9]); // J: Basket Size
        const mfp = parseNumber(row[10]);       // K: MFP
        const mfc = parseNumber(row[11]);       // L: MFC
        const cpo = parseNumber(row[12]);       // M: CPO
        const gms = parseNumber(row[13]);       // N: GMS
        const baseComm = parseNumber(row[14]);  // O: Basic Commission
        aov = parseNumber(row[15]);             // P: AOV (Ambil yang terakhir)
        const adsMobile = parseNumber(row[16]); // Q: Ads Mobile
        const adsWeb = parseNumber(row[17]);    // R: Ads Web
        const adsDirect = parseNumber(row[18]); // S: Direct Ads

        // Kalkulasi Matriks Inti
        const totalAds = adsMobile + adsWeb + adsDirect;
        const merchantInvestment = mfp + mfc + totalAds + cpo + gms + baseComm;
        const netSales = basketSize - merchantInvestment;

        return {
          month: monthLabel,
          basketSize,
          merchantInvestment,
          netSales
        };
      });
    }

    // --- 3. MAPPING RAW DAILY ---
    const dailyChart = Array.isArray(dailyData) 
      ? dailyData.filter(r => r[1] === selectedMex).map(r => ({
            day: r[0]?.split('-')[2] ? `Tgl ${r[0].split('-')[2]}` : r[0],
            'Orders': parseInt(r[2]) || 0, 'Ads Spent': parseFloat(r[3]) || 0
          }))
      : [];

    return { cleanName: selectedMex.toString().trim(), mexId, amName, bsMTD, campaignRaw, aov, historyChart, dailyChart };
  }, [selectedMex, dashboardData, historisData, dailyData]);

  const isLoading = loadDash || loadHist || loadDaily;
  const anyError = errDash || errHist || errDaily;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] items-center gap-3">
        <Loader2 className="animate-spin text-[#00B14F]" size={40} />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mengkalkulasi Matriks Finansial...</p>
      </div>
    );
  }

  if (anyError) return <div className="p-4 m-4 bg-red-50 text-red-700 font-bold rounded-xl text-xs flex items-center gap-2"><AlertCircle size={16} /><span>Gagal memuat data: {anyError.toString()}</span></div>;

  // ⚡ TOOLTIP KHUSUS HISTORI (Mewah & Jelas)
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

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-4 sm:space-y-6 -mx-2 sm:mx-0 select-none [&_*]:outline-none">
      
      {/* HEADER */}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-[#00B14F]/5 -mr-4 -mb-4"><ShoppingCart size={100}/></div>
              <div className="p-3 bg-[#E5F7ED] text-[#00B14F] rounded-2xl"><ShoppingCart size={24} /></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Basket Size MTD</span><h3 className="text-lg sm:text-2xl font-black text-slate-900">{formatRupiah(profile.bsMTD)}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-[#FF7A00]/5 -mr-4 -mb-4"><DollarSign size={100}/></div>
              <div className="p-3 bg-[#FFF2E5] text-[#FF7A00] rounded-2xl"><DollarSign size={24} /></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nilai Tiket (AOV) Rata-Rata</span><h3 className="text-lg sm:text-2xl font-black text-slate-900">{formatRupiah(profile.aov)}</h3></div>
            </div>
          </div>

          {/* ⚡ CHART 1: HISTORI FINANSIAL & INVESTMENT (BARU) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
            <div className="mb-6 border-b border-slate-100 pb-3 text-center">
              <h4 className="text-sm sm:text-base font-black text-slate-900">Performa Finansial 6 Bulan Terakhir</h4>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Komparasi Penjualan Bersih (Net Sales) vs Total Investasi Toko (Comm, Promo, Ads)</p>
            </div>
            <div className="h-[280px] sm:h-[350px] w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={profile.historyChart} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<HistoryTooltip />} cursor={{ fill: 'transparent' }} />
                  <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '15px' }} />
                  
                  {/* Stacked Bar (Net Sales di Bawah, Investment di Atas) */}
                  <Bar dataKey="netSales" name="Net Sales" stackId="a" fill="#00B14F" radius={[0, 0, 4, 4]} barSize={36} />
                  <Bar dataKey="merchantInvestment" name="Total Investment" stackId="a" fill="#FF7A00" radius={[4, 4, 0, 0]} barSize={36} />
                  
                  {/* Line Trend untuk Total Basket Size Utuh */}
                  <Line type="monotone" dataKey="basketSize" name="Gross Basket Size" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-4 border-b border-slate-100 pb-3 text-center"><h4 className="text-sm sm:text-base font-black text-slate-900">Tren Pesanan Selesai Harian</h4></div>
              <div className="h-[220px] sm:h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profile.dailyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={9} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Orders" stroke="#00B14F" strokeWidth={3} dot={{ r: 3, fill: '#00B14F' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-4 border-b border-slate-100 pb-3 text-center"><h4 className="text-sm sm:text-base font-black text-slate-900">Alokasi Harian GrabAds</h4></div>
              <div className="h-[220px] sm:h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profile.dailyChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={9} />
                    <Tooltip formatter={(v) => [formatRupiah(v), 'Ads Spent']} />
                    <Bar dataKey="Ads Spent" fill="#FF7A00" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
                ) : <span className="text-slate-400 italic text-xs">Tidak ada program promosi aktif.</span>}
              </div>
            </div>
          </div>
        </div>
      ) : <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs font-bold italic">Silakan pilih merchant untuk memulai presentasi.</div>}
    </div>
  );
}