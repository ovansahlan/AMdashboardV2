import React, { useState, useMemo, useContext, useEffect } from 'react'; 
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../context/GlobalContext'; 
import { BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { Loader2, AlertCircle, Award, Store, UserCircle, Megaphone, ShoppingCart, Clock, CheckCircle2, TrendingUp, MonitorPlay, Users, Percent, DollarSign, Search, X, Wallet, Image, PieChart, MapPin, Copy } from 'lucide-react';

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

const getShortAmName = (fullName) => {
  if (!fullName) return 'Unassigned';
  const name = fullName.toLowerCase();
  if (name.includes('novan')) return 'Novan';
  if (name.includes('dadan')) return 'Dadan';
  if (name.includes('regianaldo') || name.includes('aldo')) return 'Aldo';
  if (name.includes('saeful hikam') || name.includes('hikam') || name.includes('hilkam')) return 'Hilkam';
  return fullName.split(' ')[0];
};

export default function MerchantPresentation() {
  const { data: dashboardData, isLoading: loadDash, error: errDash } = useSheetData('getDashboard');
  const { data: historisData, isLoading: loadHist, error: errHist } = useSheetData('getHistoris');

  const { selectedAm } = useContext(GlobalFilterContext); 
  const [selectedMex, setSelectedMex] = useState('');
  
  const [searchMex, setSearchMex] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(''); 

  const handleCopyShortcut = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000); 
  };

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
    let bsMTD = 0, amName = 'Unassigned', mexId = '-', campaignRaw = '', mcaAmount = 0, city = '-', baseComm = '-';
    let mcaStatus = '', mcaDate = '';

    if (dashRow) {
      amName = dashRow[2] ? dashRow[2].toString().trim() : 'Unassigned';
      mexId = dashRow[3] || '-';
      city = dashRow[8] ? dashRow[8].toString().trim() : '-'; 
      baseComm = dashRow[13] ? dashRow[13].toString().trim() : '-'; 
      bsMTD = parseNumber(dashRow[19]);
      mcaAmount = parseNumber(dashRow[37]);
      mcaStatus = dashRow[39] ? dashRow[39].toString().trim() : ''; // Status MCA
      mcaDate = dashRow[40] ? dashRow[40].toString().trim() : '';   // Tanggal MCA
      campaignRaw = dashRow[44] || ''; 
    }

    const shortAmName = getShortAmName(amName);

    let historyChart = [], lastAov = 0, lastPhotoPenetration = '-';
    let sumInvestment = 0, sumBasketSize = 0, sumOnlineHours = 0, countOnlineHours = 0;
    let sumTotalAds = 0, sumBsWithAds = 0;
    
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
        const histBaseComm = parseNumber(row[14]);           
        const aov = parseNumber(row[15]);                
        const adsMobile = parseNumber(row[16]);          
        const adsWeb = parseNumber(row[17]);             
        const adsDirect = parseNumber(row[18]);          
        const onlineHours = parseNumber(row[29]);
        const adsOrders = parseNumber(row[21]); 
        const bsWithAds = parseNumber(row[22]); // Kolom W: Basket Size with Ads     
        const photoPenetration = row[28] ? row[28].toString().trim() : '-';       

        const promoUsageRate = totalOrders > 0 ? Math.round((promoOrders / totalOrders) * 100) : 0;
        const totalAds = adsMobile + adsWeb + adsDirect;
        const totalCpoGms = cpo + gms;
        const merchantInvestment = mfp + mfc + totalAds + totalCpoGms + histBaseComm;
        const netSales = basketSize - merchantInvestment;
        const uncompletedOrders = Math.max(0, totalOrders - completedOrders);

        // Akumulasi rata-rata 6 Bulan
        sumInvestment += merchantInvestment;
        sumBasketSize += basketSize;
        if (onlineHours > 0) {
          sumOnlineHours += onlineHours;
          countOnlineHours++;
        }
        sumTotalAds += totalAds;
        sumBsWithAds += bsWithAds;

        lastAov = aov;
        lastPhotoPenetration = photoPenetration;

        return {
          month: monthLabel, basketSize, merchantInvestment, netSales,
          completedOrders, totalOrders, uncompletedOrders, adsOrders, aov, promoUsageRate, onlineHours,
          baseComm: histBaseComm, mfp, mfc, totalAds, totalCpoGms, photoPenetration
        };
      });
    }

    // Kalkulasi Average (6 Bulan)
    const avgInvestmentRate = sumBasketSize > 0 ? ((sumInvestment / sumBasketSize) * 100).toFixed(1) : 0;
    const avgOnlineHours = countOnlineHours > 0 ? Math.round(sumOnlineHours / countOnlineHours) : 0;
    const avgRoas = sumTotalAds > 0 ? (sumBsWithAds / sumTotalAds).toFixed(1) : 0;

    return { 
      cleanName: selectedMex.toString().trim(), mexId, shortAmName, city, baseComm, bsMTD, campaignRaw, 
      mcaAmount, mcaStatus, mcaDate, aov: lastAov, photoPenetration: lastPhotoPenetration, 
      avgInvestmentRate: `${avgInvestmentRate}%`, avgOnlineHours, avgRoas: `${avgRoas}x`,
      historyChart 
    };
  }, [selectedMex, dashboardData, historisData]);

  const isLoading = loadDash || loadHist;
  const anyError = errDash || errHist;

  if (isLoading) return <div className="flex flex-col justify-center min-h-[70vh] items-center gap-3"><Loader2 className="animate-spin text-[#00B14F]" size={40} /><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Membangun Struktur Pitching Deck...</p></div>;
  if (anyError) return <div className="p-4 m-4 bg-red-50 text-red-700 font-bold rounded-xl text-xs flex items-center gap-2"><AlertCircle size={16} /><span>Gagal memuat data: {anyError.toString()}</span></div>;

  // =========================================================================
  // ⚡ REVISI TOOLTIP (SPACING & PADDING DIPERBESAR)
  // =========================================================================

  const HistoryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const invPct = data.basketSize > 0 ? ((data.merchantInvestment / data.basketSize) * 100).toFixed(1) : 0;
      const netPct = data.basketSize > 0 ? ((data.netSales / data.basketSize) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[320px]">
          <p className="font-black text-slate-900 text-base text-center border-b border-slate-100 pb-3 mb-4 tracking-wide">{label}</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#00B14F] font-bold flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-[#00B14F]"></div> Net Sales ({netPct}%)
              </span>
              <span className="font-mono font-black text-[#00B14F] text-base">{formatRupiah(data.netSales)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#FF7A00] font-bold flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-[#FF7A00]"></div> Investment ({invPct}%)
              </span>
              <span className="font-mono font-black text-[#FF7A00] text-base">{formatRupiah(data.merchantInvestment)}</span>
            </div>
          </div>
          <div className="pt-5 mt-5 border-t border-dashed border-slate-300 flex justify-between items-center bg-slate-50 -mx-2 px-3 py-2.5 rounded-xl">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Gross Basket Size</span>
            <span className="font-mono font-black text-slate-900 text-lg">{formatRupiah(data.basketSize)}</span>
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
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[320px] space-y-4 text-xs">
          <p className="font-black text-slate-900 border-b border-slate-100 pb-3 text-center text-sm">Rincian Investasi: {label}</p>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="font-bold text-slate-600">1. Komisi Dasar</span><span className="font-mono font-black text-slate-700">{formatRupiah(data.baseComm)}</span></div>
            <div className="flex justify-between"><span className="font-bold text-purple-600">2. Promo (MFP)</span><span className="font-mono font-black text-purple-600">{formatRupiah(data.mfp)}</span></div>
            <div className="flex justify-between"><span className="font-bold text-pink-600">3. Diskon (MFC)</span><span className="font-mono font-black text-pink-600">{formatRupiah(data.mfc)}</span></div>
            <div className="flex justify-between"><span className="font-bold text-amber-600">4. Iklan (Ads)</span><span className="font-mono font-black text-amber-600">{formatRupiah(data.totalAds)}</span></div>
            <div className="flex justify-between"><span className="font-bold text-blue-500">5. CPO & GMS</span><span className="font-mono font-black text-blue-500">{formatRupiah(data.totalCpoGms)}</span></div>
          </div>
          <div className="pt-4 mt-2 border-t border-dashed border-slate-300 flex justify-between font-black text-slate-900 text-base"><span>Total Alokasi</span><span className="font-mono text-[#FF7A00]">{formatRupiah(data.merchantInvestment)}</span></div>
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
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-4 min-w-[260px]">
          <p className="font-black text-slate-900 border-b border-slate-100 pb-3 text-center text-sm">{label}</p>
          <div className="space-y-3">
            <div className="flex justify-between gap-4 text-[#00B14F]"><span className="font-bold">Selesai (Completed):</span><span className="font-black text-sm">{completed}</span></div>
            <div className="flex justify-between gap-4 text-red-500"><span className="font-bold">Batal/Gagal:</span><span className="font-black text-sm">{uncompleted}</span></div>
            <div className="flex justify-between gap-4 text-blue-500"><span className="font-bold">Order dari Iklan (Ads):</span><span className="font-black text-sm">{adsOrders}</span></div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-center font-bold text-slate-500 bg-slate-50 rounded-xl p-2.5">Total Masuk: <span className="text-slate-800 font-black">{total}</span> | Success: <span className="text-[#00B14F] font-black">{completionRate}%</span></div>
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
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-3 min-w-[260px]">
          <p className="font-black text-slate-900 border-b border-slate-100 pb-3 text-center text-sm">{label}</p>
          <div className="space-y-3">
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
      
      {/* 1. HEADER & SEARCHABLE DROPDOWN */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-4 relative mx-2 sm:mx-0 z-40">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00B14F] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#00B14F]/10"><MonitorPlay size={20} className="text-white sm:w-6 sm:h-6" /></div>
          <div><h1 className="text-base sm:text-xl font-black text-slate-900">Pitching Deck Mode</h1><p className="text-[10px] sm:text-xs font-bold text-[#00B14F] uppercase tracking-wider">Presentasi Kinerja Partner</p></div>
        </div>

        <div className="relative w-full lg:w-[400px]">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl w-full focus-within:border-[#00B14F] transition-colors shadow-sm">
            <Search size={16} className="text-[#00B14F] shrink-0" />
            <input type="text" value={searchMex} onChange={(e) => { setSearchMex(e.target.value); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} placeholder="Cari Nama Toko / ID Merchant..." className="text-xs sm:text-sm font-black text-slate-800 bg-transparent outline-none w-full truncate"/>
            {searchMex && <X size={14} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => { setSearchMex(''); setIsDropdownOpen(true); }} />}
          </div>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-xl max-h-[300px] overflow-y-auto z-50 py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(m => (
                  <div key={m.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-xs sm:text-sm font-bold text-slate-700 border-b border-slate-50 last:border-0" onMouseDown={(e) => { e.preventDefault(); setSelectedMex(m.fullName); setSearchMex(m.name); setIsDropdownOpen(false); }}>
                    {m.name} <span className="text-[10px] font-normal text-slate-400 block mt-0.5">{m.id}</span>
                  </div>
                ))
              ) : <div className="px-4 py-4 text-xs text-slate-500 font-medium italic text-center">Data tidak ditemukan...</div>}
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
            
            {/* KARTU PROFIL EKSKLUSIF (Lebar 2 Kolom) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 group flex-wrap mb-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{profile.cleanName}</h3>
                  <button onClick={() => handleCopyShortcut(profile.cleanName, 'name')} className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-[#00B14F] rounded-lg transition-all" title="Copy Nama">
                    {copiedField === 'name' ? <CheckCircle2 size={15} className="text-[#00B14F]" /> : <Copy size={15} />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5 mb-4 mt-2">
                  <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 font-mono font-bold text-[10px] rounded-lg flex items-center gap-1.5 tracking-wider">
                    ID: {profile.mexId}
                    <button onClick={() => handleCopyShortcut(profile.mexId, 'id')} className="hover:text-[#00B14F] transition-colors ml-0.5" title="Copy ID">
                      {copiedField === 'id' ? <CheckCircle2 size={12} className="text-[#00B14F]" /> : <Copy size={12} />}
                    </button>
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[10px] rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                    <UserCircle size={12}/> AM: {profile.shortAmName}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 font-bold text-[10px] rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin size={12}/> {profile.city}
                  </span>
                  <span className="px-2.5 py-1 bg-purple-50 border border-purple-100 text-purple-600 font-bold text-[10px] rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                    <Percent size={12}/> Comm: {profile.baseComm}
                  </span>
                  <span className="px-2.5 py-1 bg-pink-50 border border-pink-100 text-pink-600 font-bold text-[10px] rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                    <Image size={12}/> Foto: {profile.photoPenetration}
                  </span>
                </div>
              </div>
              
              {/* Highlight MCA di Bawah Profil */}
              <div className="bg-[#E5F7ED] p-3 sm:p-4 rounded-2xl border border-[#00B14F]/20 flex flex-col justify-center w-full mt-2">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] sm:text-xs font-bold text-[#00B14F] uppercase tracking-wider flex items-center gap-1.5"><Wallet size={14}/> Limit Pencairan (MCA)</span>
                   {profile.mcaStatus.toLowerCase() === 'disbursed' ? (
                     <span className="text-[9px] sm:text-[10px] bg-[#00B14F] text-white px-2 py-0.5 rounded-md font-bold shadow-sm flex items-center gap-1"><CheckCircle2 size={10}/> Cair: {profile.mcaDate}</span>
                   ) : profile.mcaStatus.toLowerCase().includes('pending') ? (
                     <span className="text-[9px] sm:text-[10px] bg-white text-amber-500 border border-amber-200 px-2 py-0.5 rounded-md font-bold">Pending Cair</span>
                   ) : (
                     <span className="text-[9px] sm:text-[10px] bg-white text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md font-bold">Tidak Pernah / Tidak Aktif</span>
                   )}
                 </div>
                 <span className="font-black text-[#00B14F] text-lg sm:text-2xl mt-0.5">{formatRupiah(profile.mcaAmount)}</span>
              </div>
            </div>

            {/* KARTU PROMO AKTIF BERGAYA WADAH (Lebar 1 Kolom) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                 <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2"><Award size={18} className="text-[#FF7A00]"/> Promo Aktif</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">Partisipasi promo resto saat ini</p>
                 </div>
              </div>
              
              {/* Maksimal 2 baris (90px) sebelum jadi scrollable */}
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-2 items-start overflow-y-auto max-h-[100px]">
                {profile.campaignRaw && profile.campaignRaw !== '-' && profile.campaignRaw !== '0' ? (
                  profile.campaignRaw.split('|').filter(c => c && c.trim() !== '').map((c, i) => (
                    <span key={i} className="px-3 py-1.5 w-full bg-white border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-bold rounded-xl shadow-sm flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#00B14F] shrink-0"/> <span className="truncate">{c.trim()}</span>
                    </span>
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-xs font-semibold text-center">Tidak ada promo aktif.</div>
                )}
              </div>
            </div>

          </div>
          
          {/* ======================================================== */}
          {/* 3. 5 KPI CARDS (DITAMBAH ROAS & AVERAGE KALKULASI)         */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mx-2 sm:mx-0">
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
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Avg. Investasi (6bln)</span><p className="text-sm sm:text-base font-black text-slate-900">{profile.avgInvestmentRate}</p></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Clock size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Avg. Jam Buka (6bln)</span><p className="text-sm sm:text-base font-black text-slate-900">{profile.avgOnlineHours} Jam</p></div>
            </div>
            {/* ⚡ CARD ROAS BARU */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 col-span-2 lg:col-span-1">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0"><TrendingUp size={18} /></div>
              <div><span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">ROAS Ads (6Bln)</span><p className="text-sm sm:text-base font-black text-slate-900">{profile.avgRoas}</p></div>
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
                      <Bar dataKey="merchantInvestment" name="Total Investasi" stackId="a" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={32} />
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
              <div className="mb-4 border-b border-slate-100 pb-3 text-center"><h4 className="text-sm sm:text-base font-black text-slate-900">Efisiensi Order Bulanan</h4><p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Selesai vs Batal, disandingkan dengan sumbangan Order dari Iklan</p></div>
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