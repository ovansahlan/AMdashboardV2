import React, { useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../context/GlobalContext'; //  Ganti dengan ini
import { Loader2, AlertCircle, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, UserCircle, Megaphone, TrendingUp, TrendingDown, Target, AlertOctagon, Flame, PowerOff } from 'lucide-react';

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);

const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '' || val === '#N/A') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/Rp/g, '').trim();
  return isNaN(parseFloat(cleanStr)) ? 0 : parseFloat(cleanStr);
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

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function AdsTracker() {
  const { data, isLoading, error } = useSheetData('getDashboard');
  const navigate = useNavigate();
  const { selectedAm, setSelectedAm } = useContext(GlobalFilterContext); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'dropPct', direction: 'asc' }); // Default urutkan dari yang paling drop

  // ⚡ ENGINE: Ambil Tanggal Report untuk Kalkulasi Runrate
  const reportDate = useMemo(() => {
    let date = new Date(); 
    if (data && data.length > 1 && data[1].length > 2) {
      const c2Cell = data[1][2]; 
      if (c2Cell && c2Cell.toString().trim() !== '') {
        const match = c2Cell.toString().match(/\d{1,2}\s+[a-zA-Z]+\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/);
        if (match) {
          const parsed = Date.parse(match[0]);
          if (!isNaN(parsed)) date = new Date(parsed);
        }
      }
    }
    return date;
  }, [data]);

  const amList = useMemo(() => {
    if (!data || data.length === 0) return ['All'];
    const uniqueAms = new Set();
    data.forEach(row => {
      const amName = row[2];
      const mexName = row[4]; 
      if (amName && typeof amName === 'string' && amName.trim() !== '' && amName !== 'AM Name' && !amName.toLowerCase().includes('update') && mexName && mexName !== 'Mex Name') {
        uniqueAms.add(amName.trim());
      }
    });
    return ['All', ...Array.from(uniqueAms).sort()];
  }, [data]);

  const { metrics, processedData } = useMemo(() => {
    if (!data || data.length === 0) return { metrics: null, processedData: [] };

    let totalAdsMTD = 0, totalAdsLM = 0, countKritis = 0, countMati = 0;
    const rawList = [];

    // Setup Multiplier untuk Proyeksi Akhir Bulan (Runrate)
    const currentDay = reportDate.getDate() || 1;
    const daysInMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0).getDate();
    const runrateMultiplier = daysInMonth / currentDay;

    data.forEach((row, index) => {
      const mexName = row[4];
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A' || mexName.toString().toLowerCase().includes('update')) return;

      const rawAmName = row[2] ? row[2].toString().trim() : 'Unassigned';
      if (selectedAm !== 'All' && rawAmName !== selectedAm) return;

      const adsLM = parseNumber(row[30]);
      const adsSpent = parseNumber(row[31]); // Ads MTD
      
      // Hitung Ads Runrate. Jika ada di row[32] silakan pakai, jika tidak kita kalkulasi manual.
      const adsRR = parseNumber(row[32]) > 0 ? parseNumber(row[32]) : (adsSpent * runrateMultiplier);

      const mexId = row[3] && row[3] !== '' ? row[3] : `MEX-${1000 + index}`; 
      const shortAmName = getShortAmName(rawAmName); 
      let cleanName = mexName.trim();

      // Hanya proses yang pernah bakar Ads (LM atau MTD)
      if (adsSpent > 0 || adsLM > 0) {
        totalAdsMTD += adsSpent;
        totalAdsLM += adsLM;

        // Kalkulasi Penurunan / Kenaikan
        let dropPct = 0;
        if (adsLM > 0) dropPct = ((adsRR - adsLM) / adsLM) * 100;
        else if (adsSpent > 0 && adsLM === 0) dropPct = 100;

        // Kategori Status
        let status = 'Aman';
        if (adsLM > 0 && adsSpent === 0) {
          status = 'Mati';
          dropPct = -100;
          countMati++;
        } else if (dropPct <= -50) {
          status = 'Kritis';
          countKritis++;
        } else if (dropPct < 0) {
          status = 'Turun';
        } else if (adsLM === 0 && adsSpent > 0) {
          status = 'New Spender';
        } else {
          status = 'Naik / Stabil';
        }

        rawList.push({
          id: index,
          mexId: mexId.toString().trim(),
          mexName: cleanName,
          amName: rawAmName,
          shortAmName, 
          adsSpent,
          adsLM,
          adsRR,
          dropPct,
          status
        });
      }
    });

    // Kalkulasi Global Growth
    const globalGrowth = totalAdsLM > 0 ? ((totalAdsMTD - totalAdsLM) / totalAdsLM) * 100 : 0;

    // Filter Pencarian & Status
    let filtered = [...rawList];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(m => m.mexName.toLowerCase().includes(lowerSearch) || m.mexId.toLowerCase().includes(lowerSearch));
    }
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string') return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return { 
      metrics: { totalAdsMTD, totalAdsLM, globalGrowth, countKritis, countMati, activeSpenders: rawList.length }, 
      processedData: filtered 
    };
  }, [data, selectedAm, searchTerm, statusFilter, sortConfig, reportDate]);

  const requestSort = (key) => {
    let direction = 'asc'; 
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; 
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => sortConfig.key !== key ? <ArrowUpDown size={12} className="text-slate-300 ml-1" /> : (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-[#00B14F] ml-1" /> : <ChevronDown size={12} className="text-[#00B14F] ml-1" />);

  // Pewarnaan Badge Status Ads
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Mati': return <span className="bg-slate-800 text-white px-2 py-0.5 rounded font-bold text-[10px] sm:text-xs flex items-center gap-1 w-max"><PowerOff size={10}/> Ads Mati</span>;
      case 'Kritis': return <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded font-bold text-[10px] sm:text-xs flex items-center gap-1 w-max"><AlertOctagon size={10}/> Kritis</span>;
      case 'Turun': return <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px] sm:text-xs flex items-center gap-1 w-max"><TrendingDown size={10}/> Turun</span>;
      case 'New Spender': return <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-bold text-[10px] sm:text-xs flex items-center gap-1 w-max"><Flame size={10}/> New Spender</span>;
      default: return <span className="bg-[#E5F7ED] text-[#00B14F] border border-[#00B14F]/20 px-2 py-0.5 rounded font-bold text-[10px] sm:text-xs flex items-center gap-1 w-max"><TrendingUp size={10}/> Naik / Stabil</span>;
    }
  };

  if (isLoading) return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-[#00B14F]" size={36} /></div>;
  if (error || !metrics) return <div className="p-4 m-4 bg-red-50 text-red-700 font-bold rounded-xl text-sm">Data kosong/Error: {error}</div>;

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-3 sm:space-y-6 -mx-2 sm:mx-0">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF7A00] rounded-xl flex items-center justify-center shrink-0">
            <Target size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Ads Retention</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Pantau pergerakan & retensi budget iklan merchant.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl w-full sm:w-auto">
          <Filter size={16} className="text-[#FF7A00] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-600 shrink-0">AM:</span>
          <select value={selectedAm} onChange={(e) => setSelectedAm(e.target.value)} className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer w-full">
            {amList.map((am) => <option key={am} value={am}>{am === 'All' ? 'Semua AM' : am}</option>)}
          </select>
        </div>
      </div>

      {/* --- KPI CARDS (Disesuaikan untuk Follow Up Kritis) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><Megaphone size={80} /></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Ads MTD</span>
          <h3 className="text-lg sm:text-2xl font-black text-[#FF7A00]">{formatRupiah(metrics.totalAdsMTD)}</h3>
        </div>
        
        <div className="bg-white p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Tren MTD vs LM</span>
          <div className="flex items-end gap-2">
            <h3 className="text-lg sm:text-2xl font-black text-slate-800">{formatRupiah(metrics.totalAdsLM)}</h3>
            <span className="text-xs font-bold text-slate-400 mb-1">LM</span>
          </div>
          <div className="mt-2">
            {metrics.globalGrowth >= 0 ? (
               <span className="text-[#00B14F] font-bold inline-flex items-center text-[10px] bg-[#E5F7ED] px-2 py-1 rounded">
                 <TrendingUp size={12} className="mr-1"/> +{metrics.globalGrowth.toFixed(1)}% vs LM
               </span>
            ) : (
               <span className="text-[#E02424] font-bold inline-flex items-center text-[10px] bg-red-50 px-2 py-1 rounded">
                 <TrendingDown size={12} className="mr-1"/> {metrics.globalGrowth.toFixed(1)}% vs LM
               </span>
            )}
          </div>
        </div>

        {/* ⚡ CARD ALERT KRITIS */}
        <div className="bg-red-50 p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-red-200 flex flex-col relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-red-600"><AlertOctagon size={70} /></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600/80 mb-1">Merchant Kritis (≥ -50%)</span>
          <div className="flex items-center gap-3">
             <h3 className="text-lg sm:text-3xl font-black text-red-600">{metrics.countKritis}</h3>
             <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-1 rounded border border-red-200">Butuh Follow Up</span>
          </div>
        </div>

        {/* ⚡ CARD ADS MATI */}
        <div className="bg-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-700 flex flex-col relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-white"><PowerOff size={70} /></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ads Mati (Drop 100%)</span>
          <div className="flex items-center gap-3">
             <h3 className="text-lg sm:text-3xl font-black text-white">{metrics.countMati}</h3>
             <span className="text-[10px] font-bold text-slate-300 bg-slate-700 px-2 py-1 rounded border border-slate-600">Toko</span>
          </div>
        </div>
      </div>

      {/* --- KONTROL FILTER TABEL --- */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-[#FF7A00] transition-colors">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input 
            type="text" placeholder="Cari Merchant / MEX ID..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm font-medium text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer w-full">
            <option value="All">Semua Status</option>
            <option value="Kritis">🚨 Kritis (Drop ≥ 50%)</option>
            <option value="Mati">💀 Ads Mati (Drop 100%)</option>
            <option value="Turun">⚠️ Turun (Aman)</option>
            <option value="Naik / Stabil">🔥 Naik / Stabil</option>
            <option value="New Spender">✨ New Spender</option>
          </select>
        </div>
      </div>

      {/* --- TABEL DATA --- */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max md:min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-2.5 py-3 sm:p-4 w-8 sm:w-12 text-center font-bold">No</th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100 w-[200px] sm:w-[280px]" onClick={() => requestSort('mexName')}>
                  <div className="flex items-center">Merchant Info {getSortIcon('mexName')}</div>
                </th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('status')}>
                  <div className="flex items-center">Status Retention {getSortIcon('status')}</div>
                </th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('dropPct')}>
                  <div className="flex items-center">Trend (RR vs LM) {getSortIcon('dropPct')}</div>
                </th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('adsRR')}>
                  <div className="flex items-center">Est. Runrate (RR) {getSortIcon('adsRR')}</div>
                </th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('adsSpent')}>
                  <div className="flex items-center text-[#FF7A00]">Ads MTD {getSortIcon('adsSpent')}</div>
                </th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('adsLM')}>
                  <div className="flex items-center">Ads LM {getSortIcon('adsLM')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm divide-y divide-slate-100">
              {processedData.length === 0 ? (
                <tr><td colSpan="7" className="p-6 text-center text-slate-500 font-medium text-xs">Tidak ada data Ads.</td></tr>
              ) : (
                processedData.map((merchant, index) => {
                  // Warna baris merah tipis jika Kritis atau Mati
                  const isAlert = merchant.status === 'Kritis' || merchant.status === 'Mati';

                  return (
                    <tr key={merchant.id} onClick={() => navigate(`/merchant/${merchant.mexId}`)} className={`transition-colors group cursor-pointer ${isAlert ? 'bg-red-50/30 hover:bg-red-50/80' : 'hover:bg-slate-50'}`}>
                      <td className="px-2.5 py-3 sm:p-4 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="px-2.5 py-3 sm:p-4 max-w-[200px] sm:max-w-[280px]">
                        <div className="font-black text-slate-800 text-[13px] sm:text-sm truncate" title={merchant.mexName}>{merchant.mexName}</div>
                        <div className="flex items-center gap-2 mt-1 overflow-hidden">
                          <span className="font-mono text-[9px] sm:text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 truncate">{merchant.mexId}</span>
                          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                            <UserCircle size={10} className="sm:w-3 sm:h-3"/> {merchant.shortAmName}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-2.5 py-3 sm:p-4">{getStatusBadge(merchant.status)}</td>

                      <td className="px-2.5 py-3 sm:p-4 font-mono font-black">
                        {merchant.dropPct === 0 ? (
                          <span className="text-slate-400">0%</span>
                        ) : (
                          <span className={merchant.dropPct > 0 ? 'text-[#00B14F]' : 'text-red-600'}>
                            {merchant.dropPct > 0 ? '+' : ''}{merchant.dropPct.toFixed(1)}%
                          </span>
                        )}
                      </td>

                      <td className="px-2.5 py-3 sm:p-4 font-mono font-bold text-slate-700">{formatRupiah(merchant.adsRR)}</td>
                      <td className="px-2.5 py-3 sm:p-4 font-mono font-black text-[#FF7A00]">{formatRupiah(merchant.adsSpent)}</td>
                      <td className="px-2.5 py-3 sm:p-4 font-mono font-medium text-slate-500">{formatRupiah(merchant.adsLM)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}