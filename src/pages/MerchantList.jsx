import React, { useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../App';
import { Loader2, AlertCircle, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, Store, UserCircle } from 'lucide-react';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);
};

const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '' || val === '#N/A') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/Rp/g, '').trim();
  return isNaN(parseFloat(cleanStr)) ? 0 : parseFloat(cleanStr);
};

const parseCampaign = (val) => {
  if (!val || typeof val !== 'string' || val.trim() === '' || val === '0' || val === '-' || val.toLowerCase().includes('no campaign') || val === '#n/a') return 'Zero Campaign';
  const str = val.toLowerCase();
  const hasGMS = str.includes('gms booster') || str.includes('gms cuan');
  const hasLocal = str.split('|').some(p => !p.trim().includes('gms booster') && !p.trim().includes('gms cuan'));
  if (hasGMS && hasLocal) return 'GMS & Local';
  if (hasGMS && !hasLocal) return 'GMS Only';
  if (!hasGMS && hasLocal) return 'Local Only';
  return 'Zero Campaign';
};

// ⚡ ENGINE: Pemotong Nama AM
const getShortAmName = (fullName) => {
  if (!fullName) return 'Unassigned';
  const name = fullName.toLowerCase();
  if (name.includes('novan')) return 'Novan';
  if (name.includes('dadan')) return 'Dadan';
  if (name.includes('regianaldo') || name.includes('aldo')) return 'Aldo';
  if (name.includes('saeful hikam') || name.includes('hikam') || name.includes('hilkam')) return 'Hilkam';
  
  // Fallback: Ambil kata pertama
  return fullName.split(' ')[0];
};

export default function MerchantList() {
  const { data, isLoading, error } = useSheetData('getDashboard');
  const navigate = useNavigate();
  const { selectedAm, setSelectedAm } = useContext(GlobalFilterContext); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'basketSize', direction: 'desc' });

  // 1. Ekstrak Daftar AM Asli (Untuk Dropdown)
  const amList = useMemo(() => {
    if (!data || data.length === 0) return ['All'];
    const uniqueAms = new Set();
    data.forEach(row => {
      const amName = row[2];
      if (amName && amName !== 'AM Name' && amName.trim() !== '') uniqueAms.add(amName.trim());
    });
    return ['All', ...Array.from(uniqueAms).sort()];
  }, [data]);

  // 2. Parsing Database Merchant
  const merchants = useMemo(() => {
    if (!data || data.length === 0) return [];
    const rawList = [];
    data.forEach((row, index) => {
      const mexName = row[4];
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A') return;

      const rawAmName = row[2] ? row[2].toString().trim() : 'Unassigned';
      const shortAmName = getShortAmName(rawAmName); // ⚡ Eksekusi pemotongan nama AM
      const mexId = row[3] && row[3] !== '' ? row[3] : `MEX-${1000 + index}`; 
      
      rawList.push({
        id: index,
        mexId: mexId.toString().trim(),
        mexName: mexName.split('-')[0].split(',')[0].trim(),
        amName: rawAmName,        // AM Asli untuk filtering
        shortAmName: shortAmName, // AM Pendek untuk tampilan
        basketSize: parseNumber(row[19]),
        adsSpent: parseNumber(row[31]),
        mcaAmount: parseNumber(row[41]),
        campaignStatus: parseCampaign(row[44])
      });
    });
    return rawList;
  }, [data]);

  // 3. Eksekusi Filter & Sorting
  const processedData = useMemo(() => {
    let filtered = [...merchants];

    // Filter Global
    if (selectedAm !== 'All') {
      filtered = filtered.filter(m => m.amName === selectedAm);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(m => m.mexName.toLowerCase().includes(lowerSearch) || m.mexId.toLowerCase().includes(lowerSearch));
    }

    if (campaignFilter !== 'All') filtered = filtered.filter(m => m.campaignStatus === campaignFilter);

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string') return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }, [merchants, searchTerm, campaignFilter, selectedAm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc'; 
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => sortConfig.key !== key ? <ArrowUpDown size={14} className="text-slate-300 ml-1" /> : (sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#00B14F] ml-1" /> : <ChevronDown size={14} className="text-[#00B14F] ml-1" />);

  const getCampaignBadge = (status) => {
    switch(status) {
      case 'GMS & Local': return 'bg-[#E5F7ED] text-[#00B14F] border-[#00B14F]/20';
      case 'GMS Only': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Local Only': return 'bg-[#FFF2E5] text-[#FF7A00] border-[#FF7A00]/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  if (isLoading) return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-[#00B14F]" size={40} /></div>;
  if (error || !merchants.length) return <div className="p-6 m-6 bg-red-50 text-red-700 font-bold rounded-xl">Data kosong/Error: {error}</div>;

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-4 sm:space-y-6">
      
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#00B14F] rounded-xl flex items-center justify-center shrink-0">
            <Store size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Merchant Database</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Toko tersaring: <span className="font-bold text-[#00B14F]">{processedData.length}</span> Outlet</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl w-full sm:w-auto">
          <Filter size={18} className="text-[#00B14F] shrink-0" />
          <span className="text-sm font-semibold text-slate-600 shrink-0">Filter AM:</span>
          <select
            value={selectedAm}
            onChange={(e) => setSelectedAm(e.target.value)}
            className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer w-full"
          >
            {amList.map((am) => (
              <option key={am} value={am}>{am === 'All' ? 'Semua AM' : am}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-[#00B14F] transition-colors">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" placeholder="Cari Nama Merchant atau Mex ID..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
          <Filter size={18} className="text-slate-400 shrink-0" />
          <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer w-full">
            <option value="All">Semua Promo</option>
            <option value="GMS & Local">GMS & Local</option>
            <option value="GMS Only">GMS Only</option>
            <option value="Local Only">Local Only</option>
            <option value="Zero Campaign">Zero Campaign</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* ⚡ PERBAIKAN: overflow-x-auto memungkinkan tabel di-scroll horizontal tanpa membuat teks penyet */}
        <div className="overflow-x-auto pb-2">
          {/* ⚡ PERBAIKAN: whitespace-nowrap mengunci agar teks tidak pernah patah ke bawah */}
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="p-4 w-12 text-center font-bold">No</th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('mexName')}>
                  <div className="flex items-center">Merchant Info {getSortIcon('mexName')}</div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('basketSize')}>
                  <div className="flex items-center">Basket Size MTD {getSortIcon('basketSize')}</div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('adsSpent')}>
                  <div className="flex items-center">Ads Spent MTD {getSortIcon('adsSpent')}</div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('mcaAmount')}>
                  <div className="flex items-center">Nilai MCA (WL) {getSortIcon('mcaAmount')}</div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('campaignStatus')}>
                  <div className="flex items-center">Status Campaign {getSortIcon('campaignStatus')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {processedData.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium">Tidak ada merchant yang cocok.</td></tr>
              ) : (
                processedData.map((merchant, index) => (
                  <tr key={merchant.id} onClick={() => navigate(`/merchant/${merchant.mexId}`)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="p-4">
                      <div className="font-black text-slate-800">{merchant.mexName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{merchant.mexId}</span>
                        {/* ⚡ MENAMPILKAN NAMA SINGKATAN AM */}
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold">
                          <UserCircle size={12}/> {merchant.shortAmName}
                        </span>
                      </div>
                    </td>
                    <td className="p-4"><div className="font-mono font-bold text-slate-700">{formatRupiah(merchant.basketSize)}</div></td>
                    <td className="p-4">{merchant.adsSpent > 0 ? <div className="font-mono font-bold text-[#FF7A00]">{formatRupiah(merchant.adsSpent)}</div> : <div className="font-mono font-medium text-slate-300">-</div>}</td>
                    <td className="p-4">{merchant.mcaAmount > 0 ? <div className="font-mono font-bold text-[#00B14F]">{formatRupiah(merchant.mcaAmount)}</div> : <div className="font-mono font-medium text-slate-300">-</div>}</td>
                    <td className="p-4"><span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold border ${getCampaignBadge(merchant.campaignStatus)}`}>{merchant.campaignStatus}</span></td>
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