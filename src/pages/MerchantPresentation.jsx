import React, { useState, useMemo, useContext, useEffect } from 'react'; 
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../context/GlobalContext'; 
import { BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { Loader2, AlertCircle, Award, Store, UserCircle, Megaphone, ShoppingCart, Clock, CheckCircle2, TrendingUp, MonitorPlay, Users, Percent, DollarSign, Search, X, Wallet, Image, PieChart } from 'lucide-react';

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
  
  const [searchMex, setSearchMex] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  useEffect(() => {
    if (merchantOptions.length > 0) {
      const looksFound = merchantOptions.find(m => m.fullName === selectedMex);
      if (!looksFound) {
        setSelectedMex(merchantOptions[0].fullName);
        setSearchMex(merchantOptions[0].name);
      } else {
        setSearchMex(looksFound.name);
      }
    } else {
      setSelectedMex('');
      setSearchMex('');
    }
  }, [merchantOptions, selectedMex]);

  const filteredOptions = useMemo(() => {
    return merchantOptions.filter(m => 
      m.name.toLowerCase().includes(searchMex.toLowerCase()) || 
      m.id.toLowerCase().includes(searchMex.toLowerCase())
    );
  }, [merchantOptions, searchMex]);

  const profile = useMemo(() => {
    if (!selectedMex || !dashboardData || !historisData) return null;

    const dashRow = dashboardData.find(r => r[4] === selectedMex);
    let bsMTD = 0, amName = 'Unassigned', mexId = '-', campaignRaw = '', mcaAmount = 0;
    if (dashRow) {
      amName = dashRow[2] ? dashRow[2].toString().trim() : 'Unassigned';
      mexId = dashRow[3] || '-';
      bsMTD = parseNumber(dashRow[19]);
      mcaAmount = parseNumber(dashRow[37]); // MAPPING MCA DARI DASHBOARD (KOLOM AL)
      campaignRaw = dashRow[44] || ''; 
    }

    let historyChart = [], lastAov = 0, lastInvestmentRate = '-', lastOnlineHours = 0, lastPhotoPenetration = '-';
    
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

        const completedOrders = parseNumber(row[5]);    
        const totalOrders = parseNumber(row[6]);        
        const promoOrders = parseNumber(row[7]);        
        const basketSize = parseNumber(row[9]);         
        const mfp = parseNumber(row[10]);                
        const mfc = parseNumber(row[11]);                
        const cpo = parseNumber(row[12]);                
        const gms = parseNumber(row[13]);                
        const baseComm = parseNumber(row[14]);           
        const aov = parseNumber(row[15]);                
        const adsMobile = parseNumber(row[16]);          
        const adsWeb = parseNumber(row[17]);             
        const adsDirect = parseNumber(row[18]);          
        const onlineHours = parseNumber(row[29]);
        const adsOrders = parseNumber(row[21]); 
        const photoPenetration = row[28] ? row[28].toString().trim() : '-';       

        const promoUsageRate = totalOrders > 0 ? Math.round((promoOrders / totalOrders) * 100) : 0;
        const totalAds = adsMobile + adsWeb + adsDirect;
        const totalCpoGms = cpo + gms;
        const merchantInvestment = mfp + mfc + totalAds + totalCpoGms + baseComm;
        const netSales = basketSize - merchantInvestment;
        
        const uncompletedOrders = Math.max(0, totalOrders - completedOrders);
        const investmentRate = basketSize > 0 ? ((merchantInvestment / basketSize) * 100).toFixed(1) : 0;

        // Ambil nilai data bulan terakhir untuk disajikan di Card Profile dan Kpi Highlight
        lastAov = aov;
        lastOnlineHours = onlineHours;
        lastPhotoPenetration = photoPenetration;
        lastInvestmentRate = `${investmentRate}%`;

        return {
          month: monthLabel, basketSize, merchantInvestment, netSales,
          completedOrders, totalOrders, uncompletedOrders, adsOrders, aov, promoUsageRate, onlineHours,
          baseComm, mfp, mfc, totalAds, totalCpoGms, photoPenetration
        };
      });
    }

    return { 
      cleanName: selectedMex.toString().trim(), mexId, amName, bsMTD, campaignRaw, mcaAmount, 
      aov: lastAov, investmentRate: lastInvestmentRate, onlineHours: lastOnlineHours, photoPenetration: lastPhotoPenetration, 
      historyChart 
    };
  }, [selectedMex, dashboardData, historisData]);

  const isLoading = loadDash || loadHist;
  const anyError = errDash || errHist;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] items-center gap-3">
        <Loader2 className="animate-spin text-[#00B14F]" size={40} />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Membangun Struktur Pitching Deck...</p>
      </div>
    );
  }

  if (anyError) return <div className="p-4 m-4 bg-red-50 text-red-700 font-bold rounded-xl text-xs flex items-center gap-2"><AlertCircle size={16} /><span>Gagal memuat data: {anyError.toString()}</span></div>;

  // =========================================================================
  // ⚡ REVISI TOOLTIP KHUSUS (DIPERLEBAR, SPASI DITAMBAH AGAR MEWAH)
  // =========================================================================

  const HistoryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const invPct = data.basketSize > 0 ? ((data.merchantInvestment / data.basketSize) * 100).toFixed(1) : 0;
      const netPct = data.basketSize > 0 ? ((data.netSales / data.basketSize) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-2xl border border-slate-100 min-w-[300px]">
          <p className="font-black text-slate-900 text-sm text-center border-b border-slate-100 pb-3 mb-4 tracking-wide">{label}</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#00B14F] font-bold flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-[#00B14F]"></div> Net Sales ({netPct}%)
              </span>
              <span className="font-mono font-black text-[#00B14F]">{formatRupiah(data.netSales)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#FF7A00] font-bold flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-[#FF7A00]"></div> Investment ({invPct}%)
              </span>
              <span className="font-mono font-black text-[#FF7A00]">{formatRupiah(data.merchantInvestment)}</span>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-dashed border-slate-200 flex justify-between items-center bg-slate-50 -mx-2 px-2 py-1.5 rounded-lg">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Gross Basket Size</span>
            <span className="font-mono font-black text-slate-900 text-base">{formatRupiah(data.basketSize)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const InvestmentTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-100 min-w-[280px] space-y-3 text-xs">
          <p className="font-black text-slate-900 border-b border-slate-100 pb-2.5 text-center text-sm">Rincian Investasi: {label}</p>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="font-bold text-slate-600">1. Komisi Dasar</span><span className="font-mono font-black text-slate-700">{formatRupiah(data.baseComm)}</span></div>
            <div className="flex justify-between"><span className="font-bold text-purple-600">2. Promo Patungan (MFP)</span><span className="font-mono font-black text-purple-600">{formatRupiah(data.mfp)}</span></div>
            <div className="flex justify-between"><span className="font-bold text-pink-600">3. Diskon Coret (MFC)</span><span className="font-mono font-black text-pink-600">{formatRupiah(data.mfc)}</span></div>
            <div className="flex justify-between"><span className="font-bold text-amber-600">4. GrabAds (Iklan)</span><span className="font-mono font-black text-amber-600">{formatRupiah(data.totalAds)}</span></div>
            <div className="flex justify-between"><span className="font-bold text-blue-500">5. Program CPO & GMS</span><span className="font-mono font-black text-blue-500">{formatRupiah(data.totalCpoGms)}</span></div>
          </div>
          <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between font-black text-slate-900 text-sm"><span>Total Alokasi</span><span className="font-mono text-[#FF7A00]">{formatRupiah(data.merchantInvestment)}</span></div>
        </div>
      );
    }
    return null;
  };

  const OrderTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const completed = payload.find(p => p.dataKey === 'completedOrders')?.value || 0;
      const uncompleted = payload.find(p => p.dataKey === 'uncompletedOrders')?.value || 0;
      const adsOrders = payload.find(p => p.dataKey === 'adsOrders')?.value || 0;
      const total = completed + uncompleted;
      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
      
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-3 min-w-[240px]">
          <p className="font-black text-slate-900 border-b border-slate-100 pb-2.5 text-center text-sm">{label}</p>
          <div className="space-y-2.5">
            <div className="flex justify-between gap-4 text-[#00B14F]"><span className="font-bold">Selesai (Completed):</span><span className="font-black text-sm">{completed}</span></div>
            <div className="flex justify-between gap-4 text-red-500"><span className="font-bold">Batal/Gagal:</span><span className="font-black text-sm">{uncompleted}</span></div>
            <div className="flex justify-between gap-4 text-blue-500"><span className="font-bold">Order dari Iklan (Ads):</span><span className="font-black text-sm">{adsOrders}</span></div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-center font-bold text-slate-500 bg-slate-50 rounded-xl mt-1 p-2">
            Total Masuk: <span className="text-slate-800 font-black">{total}</span> | Success: <span className="text-[#00B14F] font-black">{completionRate}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const AovTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const aovPayload = payload.find(p => p.dataKey === 'aov');
      const promoPayload = payload.find(p => p.dataKey === 'promoUsageRate');
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-3 min-w-[240px]">
          <p className="font-black text-slate-900 border-b border-slate-100 pb-2.5 text-center text-sm">{label}</p>
          <div className="space-y-2.5">
            <div className="flex justify-between gap-4 text-[#FF7A00]"><span className="font-bold">AOV (Harga Rata2):</span><span className="font-mono font-black text-sm">{formatRupiah(aovPayload?.value || 0)}</span></div>
            <div className="flex justify-between gap-4 text-emerald-600"><span className="font-bold">Rasio Order Promo:</span><span className="font-black text-sm">{promoPayload?.value || 0}%</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-4 sm:space-y-6 -mx-2 sm:mx-0 select-none [&_*]:outline-none pb-8">
      
      {/* ======================================================== */}
      {/* 1. HEADER & SEARCHABLE DROPDOWN                            */}
      {/* ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-4 relative mx-2 sm:mx-0 z-40">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00B14F] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#00B14F]/10">
            <MonitorPlay size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div><h1 className="text-base sm:text-xl font-black text-slate-900">Pitching Deck Mode</h1><p className="text-[10px] sm:text-xs font-bold text-[#00B14F] uppercase tracking-wider">Presentasi Kinerja Partner</p></div>
        </div>

        <div className="relative w-full lg:w-[400px]">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl w-full focus-within:border-[#00B14F] transition-colors shadow-sm">
            <Search size={16} className="text-[#00B14F] shrink-0" />
            <input
              type="text"
              value={searchMex}
              onChange={(e) => { setSearchMex(e.target.value); setIsDropdownOpen(true); }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              placeholder="Cari Nama Toko / ID Merchant..."
              className="text-xs sm:text-sm font-black text-slate-800 bg-transparent outline-none w-full truncate"
            />
            {searchMex && (
              <X size={14} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => { setSearchMex(''); setIsDropdownOpen(true); }} />
            )}
          </div>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-xl max-h-[300px] overflow-y-auto z-50 py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(m => (
                  <div
                    key={m.id}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-xs sm:text-sm font-bold text-slate-700 border-b border-slate-50 last:border-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedMex(m.fullName);
                      setSearchMex(m.name);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {m.name} <span className="text-[10px] font-normal text-slate-400 block mt-0.5">{m.id}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-xs text-slate-500 font-medium italic text-center">Data tidak ditemukan...</div>
              )}
            </div>
          )}
        </div>
      </div>

      {profile ? (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">

          {/* ======================================================== */}
          {/* 2. PROFIL MERCHANT & PROMO AKTIF (ROMBAK TOTAL UI)         */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mx-2 sm:mx-0">
            {/* KARTU PROFIL EKSKLUSIF */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2.5 leading-tight">{profile.cleanName}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 font-mono font-bold text-[10px] rounded-lg tracking-wider">
                    {profile.mexId}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[10px] rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                    <UserCircle size={12}/> AM: {profile.amName}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-2 pt-4 border-t border-slate-100">
                 <div className="bg-[#E5F7ED] p-3 rounded-2xl border border-[#00B14F]/20">
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#00B14F] uppercase block mb-1 flex items-center gap-1.5"><Wallet size={12}/> Limit MCA</span>
                    <span className="font-black text-[#00B14F] text-sm sm:text-base">{formatRupiah(profile.mcaAmount)}</span>
                 </div>
                 <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase block mb-1 flex items-center gap-1.5"><Image size={12}/> Photo Pen.</span>
                    <span className="font-black text-blue-600 text-sm sm:text-base">{profile.photoPenetration}</span>
                 </div>
              </div>
            </div>

            {/* KARTU PROMO AKTIF BERGAYA WADAH */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 md:col-span-2 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                 <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                       <Award size={18} className="text-[#FF7A00]"/> Program Promosi Aktif
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">Daftar partisipasi kampanye promo dari dashboard utama</p>
                 </div>
              </div>
              
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-wrap gap-2.5 items-start content-start overflow-y-auto max-h-[140px]">
                {profile.campaignRaw && profile.campaignRaw !== '-' && profile.campaignRaw !== '0' ? (
                  profile.campaignRaw.split('|').filter(c => c && c.trim() !== '').map((c, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl shadow-sm flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#00B14F]"/> {c.trim()}
                    </span>
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-xs font-semibold">
                    Tidak ada program promo aktif yang terdeteksi.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* ======================================================== */}
          {/* 3. CORE HIGHLIGHT CARDS (GANTI RASIO INVESTASI)            */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mx-2 sm:mx-0">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-[#E5F7ED] text-[#00B14F] rounded-xl shrink-0"><ShoppingCart size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Basket MTD</span><p className="text-sm sm:text-base font-black text-slate-900">{formatRupiah(profile.bsMTD)}</p></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-[#FFF2E5] text-[#FF7A00] rounded-xl shrink-0"><DollarSign size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">AOV Terakhir</span><p className="text-sm sm:text-base font-black text-slate-900">{formatRupiah(profile.aov)}</p></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0"><PieChart size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Rasio Investasi</span><p className="text-sm sm:text-base font-black text-slate-900">{profile.investmentRate}</p></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Clock size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Jam Buka Aktif</span><p className="text-sm sm:text-base font-black text-slate-900">{profile.onlineHours} Jam</p></div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. GRAFIK FINANSIAL & ALOKASI POTONGAN                     */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mx-2 sm:mx-0">
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-6 border-b border-slate-100 pb-3 text-center"><h4 className="text-sm sm:text-base font-black text-slate-900">Struktur Omset Bersih vs Investasi</h4><p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Komparasi Penjualan Bersih (Net Sales) vs Total Potongan Investasi Toko</p></div>
              {profile.historyChart && profile.historyChart.length > 0 ? (
                <div className="h-[250px] sm:h-[300px] w-full flex justify-center select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={profile.historyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<HistoryTooltip />} cursor={{ fill: 'transparent' }} />
                      <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '15px' }} />
                      <Bar dataKey="netSales" name="Net Sales" stackId="a" fill="#00B14F" radius={[0, 0, 4, 4]} barSize={32} />
                      <Bar dataKey="merchantInvestment" name="Total Investment" stackId="a" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={32} />
                      <Line type="monotone" dataKey="basketSize" name="Gross Sales" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="p-8 text-center text-slate-400 italic text-xs">Data histori tidak tersedia.</div>}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-6 border-b border-slate-100 pb-3 text-center"><h4 className="text-sm sm:text-base font-black text-slate-900">Alokasi Rincian Investasi Toko</h4><p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Struktur pembagian potongan (Komisi, Skema Promo Resto, dan GrabAds)</p></div>
              {profile.historyChart && profile.historyChart.length > 0 ? (
                <div className="h-[250px] sm:h-[300px] w-full flex justify-center select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profile.historyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<InvestmentTooltip />} cursor={{ fill: 'transparent' }} />
                      <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '15px' }} iconType="circle" />
                      <Bar dataKey="baseComm" name="Base Comm" stackId="inv" fill="#94A3B8" barSize={32} />
                      <Bar dataKey="mfp" name="Promo Patungan (MFP)" stackId="inv" fill="#A855F7" barSize={32} />
                      <Bar dataKey="mfc" name="Diskon Coret (MFC)" stackId="inv" fill="#EC4899" barSize={32} />
                      <Bar dataKey="totalAds" name="Iklan (GrabAds)" stackId="inv" fill="#F97316" barSize={32} />
                      <Bar dataKey="totalCpoGms" name="CPO & GMS" stackId="inv" fill="#3B82F6" barSize={32} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="p-8 text-center text-slate-400 italic text-xs">Data histori tidak tersedia.</div>}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 5. GRAFIK OPERASIONAL & AOV DUAL LINE                      */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mx-2 sm:mx-0">
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-4 border-b border-slate-100 pb-3 text-center">
                <h4 className="text-sm sm:text-base font-black text-slate-900">Efisiensi Order Bulanan</h4>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Selesai vs Batal, disandingkan dengan sumbangan Order dari Iklan</p>
              </div>
              <div className="h-[230px] sm:h-[260px] w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profile.historyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<OrderTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '15px' }} />
                    <Bar dataKey="completedOrders" name="Selesai (Completed)" stackId="order" fill="#00B14F" barSize={28} />
                    <Bar dataKey="uncompletedOrders" name="Batal / Gagal" stackId="order" fill="#EF4444" barSize={28} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="adsOrders" name="Order via GrabAds" fill="#3B82F6" barSize={28} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-4 border-b border-slate-100 pb-3 text-center"><h4 className="text-sm sm:text-base font-black text-slate-900">Korelasi AOV & Rasio Promo</h4><p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Pengaruh tingkat pesanan promo terhadap tren harga nilai tiket (AOV)</p></div>
              <div className="h-[230px] sm:h-[260px] w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={profile.historyChart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" hide domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" hide domain={[0, 100]} />
                    <Tooltip content={<AovTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Line yAxisId="left" type="monotone" dataKey="aov" name="AOV (Rupiah)" stroke="#FF7A00" strokeWidth={3} dot={{ fill: '#FF7A00', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="promoUsageRate" name="Promo Usage (%)" stroke="#10B981" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
              <div className="mb-4 border-b border-slate-100 pb-3 text-center"><h4 className="text-sm sm:text-base font-black text-slate-900">Konsistensi Jam Operasional Toko</h4><p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Total durasi jam buka toko aktif (Online Hours) secara akumulatif per bulan</p></div>
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
          
        </div>
      ) : <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs font-bold italic mx-2 sm:mx-0">Silakan cari atau pilih merchant untuk memulai presentasi.</div>}
    </div>
  );
}