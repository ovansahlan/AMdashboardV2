import React, { useMemo, useState, useContext } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../App'; // ⚡ Sinkronisasi Filter AM Global
import { Loader2, AlertCircle, Search, Filter, Calendar, CheckCircle2, XCircle, ArrowUpDown, ChevronUp, ChevronDown, UserCircle, Megaphone } from 'lucide-react';

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================
// Fungsi mengubah string tanggal menjadi objek Date agar pengurutan (sorting) 100% akurat
const safeParseDate = (dateStr) => {
  if (!dateStr || dateStr === '-' || dateStr === '0' || dateStr.trim() === '') return new Date(0);
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? new Date(0) : new Date(parsed);
};

// Format tampilan tanggal Indonesia yang rapi (Contoh: 9 Juni 2026)
const formatDateIndonesia = (dateStr) => {
  if (!dateStr || dateStr === '-' || dateStr === '0' || dateStr.trim() === '') return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr; // Jika gagal parsing, tampilkan teks aslinya
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
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
export default function GMSTracker() {
  const { data, isLoading, error } = useSheetData('getDashboard');
  const { selectedAm, setSelectedAm } = useContext(GlobalFilterContext);

  // State Kontrol Lokal
  const [activeTab, setActiveTab] = useState('opt-in'); // 'opt-in' atau 'opt-out'
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('All');

  // 1. Ekstrak Daftar AM untuk Dropdown
  const amList = useMemo(() => {
    if (!data || data.length === 0) return ['All'];
    const uniqueAms = new Set();
    data.forEach(row => {
      const amName = row[2];
      const mexName = row[4];
      if (amName && amName !== 'AM Name' && amName.trim() !== '' && !amName.toLowerCase().includes('update') && mexName && mexName !== 'Mex Name') {
        uniqueAms.add(amName.trim());
      }
    });
    return ['All', ...Array.from(uniqueAms).sort()];
  }, [data]);

  // 2. Pemrosesan Data Logika Opt-In & Opt-Out
  const lists = useMemo(() => {
    if (!data || data.length === 0) return { optInList: [], optOutList: [] };

    const optInList = [];
    const optOutList = [];

    data.forEach((row, index) => {
      const mexName = row[4];
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A' || mexName.toString().toLowerCase().includes('update')) return;

      const rawAmName = row[2] ? row[2].toString().trim() : 'Unassigned';
      const shortAmName = getShortAmName(rawAmName);
      const mexId = row[3] && row[3] !== '' ? row[3].toString().trim() : `MEX-${1000 + index}`;
      const campaignRaw = row[44] ? row[44].toString().trim() : '';

      // ⚡ SILAKAN SESUAIKAN INDEKS KOLOM DI BAWAH INI JIKA BERBEDA DI SHEET ANDA
      const optInDateRaw = row[46] ? row[46].toString().trim() : '';   // Contoh: Kolom AU (Index 46) untuk tanggal Opt-In
      const optOutDateRaw = row[47] ? row[47].toString().trim() : ''; // Contoh: Kolom AV (Index 47) untuk tanggal Opt-Out
      const optOutCampRaw = row[48] ? row[48].toString().trim() : ''; // Contoh: Kolom AW (Index 48) untuk nama campaign yang di-opt-out

      let cleanMexName = mexName.split('-')[0].split(',')[0].trim();

      // Deteksi Jenis GMS dari data aktif (kolom 44)
      let gmsType = 'Other';
      if (campaignRaw.toLowerCase().includes('booster')) gmsType = 'GMS Booster';
      else if (campaignRaw.toLowerCase().includes('cuan')) gmsType = 'GMS Cuan';

      const baseItem = {
        id: index,
        mexId,
        mexName: cleanMexName,
        amName: rawAmName,
        shortAmName
      };

      // Logika Pemisahan Data masuk ke list Opt-In atau Opt-Out
      if (optOutDateRaw && optOutDateRaw !== '-' && optOutDateRaw !== '0') {
        // Masuk ke List Opt-Out
        optOutList.push({
          ...baseItem,
          optOutDate: optOutDateRaw,
          optOutDateObj: safeParseDate(optOutDateRaw),
          optOutCampaign: optOutCampRaw || (campaignRaw !== '-' ? campaignRaw : 'GMS Program')
        });
      } else if (campaignRaw && campaignRaw !== '-' && campaignRaw !== '0' && campaignRaw.toLowerCase().includes('gms')) {
        // Masuk ke List Active Opt-In
        optInList.push({
          ...baseItem,
          gmsType,
          optInDate: optInDateRaw || 'No Date',
          optInDateObj: safeParseDate(optInDateRaw)
        });
      }
    });

    // ⚡ LOGIKA PATEN: Sortir berdasarkan tanggal terbaru (Newest First)
    optInList.sort((a, b) => b.optInDateObj - a.optInDateObj);
    optOutList.sort((a, b) => b.optOutDateObj - a.optOutDateObj);

    return { optInList, optOutList };
  }, [data]);

  // 3. Filter Data Berdasarkan Input Pengguna
  const processedData = useMemo(() => {
    let targetedList = activeTab === 'opt-in' ? [...lists.optInList] : [...lists.optOutList];

    // Filter AM Global
    if (selectedAm !== 'All') {
      targetedList = targetedList.filter(m => m.amName === selectedAm);
    }

    // Filter Pencarian Nama / MEX ID
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      targetedList = targetedList.filter(m => m.mexName.toLowerCase().includes(lower) || m.mexId.toLowerCase().includes(lower));
    }

    // Filter Tipe Campaign Khusus Tab Opt-In
    if (activeTab === 'opt-in' && campaignTypeFilter !== 'All') {
      targetedList = targetedList.filter(m => m.gmsType === campaignTypeFilter);
    }

    return targetedList;
  }, [lists, activeTab, searchTerm, selectedAm, campaignTypeFilter]);

  if (isLoading) return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-[#00B14F]" size={40} /></div>;
  if (error) return <div className="p-4 m-4 bg-red-50 text-red-700 font-bold rounded-xl text-sm">Error: {error}</div>;

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-3 sm:space-y-6 -mx-2 sm:mx-0">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00B14F] rounded-xl flex items-center justify-center shrink-0">
            <Megaphone size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Campaign Tracker</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Monitoring aktivitas keikutsertaan program GMS.</p>
          </div>
        </div>
        
        {/* GLOBAL AM FILTER */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl w-full sm:w-auto">
          <Filter size={16} className="text-[#00B14F] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-600 shrink-0">AM:</span>
          <select value={selectedAm} onChange={(e) => setSelectedAm(e.target.value)} className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer w-full">
            {amList.map((am) => <option key={am} value={am}>{am === 'All' ? 'Semua AM' : am}</option>)}
          </select>
        </div>
      </div>

      {/* --- TAB SWITCHER (SIMETRIS) --- */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-xl sm:rounded-2xl max-w-md">
        <button 
          onClick={() => { setActiveTab('opt-in'); setSearchTerm(''); }}
          className={`py-2 text-xs sm:text-sm font-black rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'opt-in' ? 'bg-white text-[#00B14F] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <CheckCircle2 size={16} /> Active Opt-In ({lists.optInList.length})
        </button>
        <button 
          onClick={() => { setActiveTab('opt-out'); setSearchTerm(''); }}
          className={`py-2 text-xs sm:text-sm font-black rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'opt-out' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <XCircle size={16} /> Opt-Out History ({lists.optOutList.length})
        </button>
      </div>

      {/* --- INPUT FILTER & PENCARIAN (COMPACT ZOOM OUT) --- */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-[#00B14F] transition-colors">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder={activeTab === 'opt-in' ? "Cari toko aktif..." : "Cari riwayat alumni toko..."}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm font-medium text-slate-800"
          />
        </div>
        
        {/* Tipe GMS Filter hanya relevan di Tab Opt-In */}
        {activeTab === 'opt-in' && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select value={campaignTypeFilter} onChange={(e) => setCampaignTypeFilter(e.target.value)} className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer w-full">
              <option value="All">Semua Tipe GMS</option>
              <option value="GMS Booster">GMS Booster Only</option>
              <option value="GMS Cuan">GMS Cuan Only</option>
            </select>
          </div>
        )}
      </div>

      {/* --- DATA TABLE CONTAINER --- */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-black">
                <th className="p-3 sm:p-4 w-12 text-center">No</th>
                <th className="p-3 sm:p-4">Merchant Info</th>
                <th className="p-3 sm:p-4">Area Manager</th>
                {activeTab === 'opt-in' ? (
                  <>
                    <th className="p-3 sm:p-4">Program GMS</th>
                    <th className="p-3 sm:p-4">Tanggal Gabung</th>
                  </>
                ) : (
                  <>
                    <th className="p-3 sm:p-4">Alumni Program</th>
                    <th className="p-3 sm:p-4">Tanggal Keluar (Opt-Out)</th>
                  </>
                )}
              </tr>
            </thead>
            
            <tbody className="text-xs sm:text-sm divide-y divide-slate-100 font-medium">
              {processedData.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400 text-xs italic">Tidak ada rekaman aktivitas campaign yang ditemukan.</td></tr>
              ) : (
                processedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 sm:p-4 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="p-3 sm:p-4">
                      <div className="font-black text-slate-800 text-[13px] sm:text-sm">{item.mexName}</div>
                      <div className="font-mono text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{item.mexId}</div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <UserCircle size={14} className="text-slate-400" />
                        <span>{item.shortAmName}</span>
                      </div>
                    </td>
                    
                    {/* TAB OPT-IN VIEW */}
                    {activeTab === 'opt-in' && (
                      <>
                        <td className="p-3 sm:p-4">
                          {/* ⚡ PERBAIKAN WARNA STRICT: Booster (Hijau Grab), Cuan (Oranye Promo) */}
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            item.gmsType === 'GMS Booster' 
                              ? 'bg-[#E5F7ED] text-[#00B14F] border-[#00B14F]/20' 
                              : 'bg-[#FFF2E5] text-[#FF7A00] border-[#FF7A00]/20'
                          }`}>
                            {item.gmsType}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-slate-600 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{formatDateIndonesia(item.optInDate)}</span>
                          </div>
                        </td>
                      </>
                    )}

                    {/* TAB OPT-OUT VIEW */}
                    {activeTab === 'opt-out' && (
                      <>
                        <td className="p-3 sm:p-4">
                          {/* Keterangan mereka keluar dari campaign apa */}
                          <div className="text-slate-700 font-bold text-xs max-w-xs truncate" title={item.optOutCampaign}>
                            ❌ {item.optOutCampaign}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-red-600 font-bold">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-red-400" />
                            <span>{formatDateIndonesia(item.optOutDate)}</span>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}