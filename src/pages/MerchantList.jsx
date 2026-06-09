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
  if (!val || typeof val !== 'string' || val.trim() === '' || val === '0' || val === '-' || val.toLowerCase().includes('no campaign') || val === '#n/a') {
    return 'Zero Campaign';
  }
  
  const str = val.toLowerCase();
  
  if (str.includes('booster+') || str.includes('booster +')) {
    return 'Booster+';
  }

  const hasGMS = str.includes('gms booster') || str.includes('gms cuan');
  const hasLocal = str.split('|').some(p => !p.trim().includes('gms booster') && !p.trim().includes('gms cuan') && !p.trim().includes('booster+'));
  
  if (hasGMS && hasLocal) return 'GMS & Local';
  if (hasGMS && !hasLocal) return 'GMS Only';
  if (!hasGMS && hasLocal) return 'Local Only';
  return 'Zero Campaign';
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

export default function MerchantList() {
  const { data, isLoading, error } = useSheetData('getDashboard');
  const navigate = useNavigate();
  const { selectedAm, setSelectedAm } = useContext(GlobalFilterContext); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'basketSize', direction: 'desc' });

  const amList = useMemo(() => {
    if (!data || data.length === 0) return ['All'];
    const uniqueAms = new Set();
    data.forEach(row => {
      const amName = row[2];
      const mexName = row[4]; 
      if (
        amName && 
        typeof amName === 'string' &&
        amName.trim() !== '' && 
        amName !== 'AM Name' && 
        !amName.toLowerCase().includes('update') && 
        !amName.toLowerCase().includes('tanggal') &&
        mexName && 
        mexName !== 'Mex Name'
      ) {
        uniqueAms.add(amName.trim());
      }
    });
    return ['All', ...Array.from(uniqueAms).sort()];
  }, [data]);

  const merchants = useMemo(() => {
    if (!data || data.length === 0) return [];
    const rawList = [];
    data.forEach((row, index) => {
      const mexName = row[4];
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A' || mexName.toString().toLowerCase().includes('update')) return;

      const rawAmName = row[2] ? row[2].toString().trim() : 'Unassigned';
      const shortAmName = getShortAmName(rawAmName); 
      const mexId = row[3] && row[3] !== '' ? row[3] : `MEX-${1000 + index}`; 
      
      rawList.push({
        id: index,
        mexId: mexId.toString().trim(),
        mexName: mexName.split('-')[0].split(',')[0].trim(),
        amName: rawAmName,
        shortAmName: shortAmName, 
        basketSize: parseNumber(row[19]),
        adsSpent: parseNumber(row[31]),
        // ⚡ PERBAIKAN: Mengambil Limit MCA dari Kolom AL (Index 37)
        mcaAmount: parseNumber(row[37]), 
        campaignStatus: parseCampaign(row[44])
      });
    });
    return rawList;
  }, [data]);

  const processedData = useMemo(() => {
    let filtered = [...merchants];
    if (selectedAm !== 'All') filtered = filtered.filter(m => m.amName === selectedAm);
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

  const getSortIcon = (key) => sortConfig.key !== key ? <ArrowUpDown size={12} className="text-slate-300 ml-1" /> : (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-[#00B14F] ml-1" /> : <ChevronDown size={12} className="text-[#00B14F] ml-1" />);

  const getCampaignBadge = (status) => {
    switch(status) {
      case 'Booster+': return 'bg-[#F4F0FF] text-[#7E22CE] border-[#7E22CE]/20';
      case 'GMS & Local': return 'bg-[#E5F7ED] text-[#00B14F] border-[#00B14F]/20';
      case 'GMS Only': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Local Only': return 'bg-[#FFF2E5] text-[#FF7A00] border-[#FF7A00]/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  if (isLoading) return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-[#00B14F]" size={36} /></div>;
  if (error || !merchants.length) return <div className="p-4 m-4 bg-red-50 text-red-700 font-bold rounded-xl text-sm">Data kosong/Error: {error}</div>;

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-3 sm:space-y-6 -mx-2 sm:mx-0">
      
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00B14F] rounded-xl flex items-center justify-center shrink-0">
            <Store size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Merchant List</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Toko tersaring: <span className="font-bold text-[#00B14F]">{processedData.length}</span> Outlet</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl w-full sm:w-auto">
          <Filter size={16} className="text-[#00B14F] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-600 shrink-0">AM:</span>
          <select
            value={selectedAm}
            onChange={(e) => setSelectedAm(e.target.value)}
            className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer w-full"
          >
            {amList.map((am) => (
              <option key={am} value={am}>{am === 'All' ? 'Semua Area Manager' : am}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-[#00B14F] transition-colors">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input 
            type="text" placeholder="Cari Nama / MEX ID..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer w-full">
            <option value="All">Semua Promo</option>
            <option value="Booster+">Booster+</option>
            <option value="GMS & Local">GMS & Local</option>
            <option value="GMS Only">GMS Only</option>
            <option value="Local Only">Local Only</option>
            <option value="Zero Campaign">Zero Campaign</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max md:min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-2.5 py-3 sm:p-4 w-8 sm:w-12 text-center font-bold">No</th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors w-[240px] sm:w-[320px] lg:w-[400px]" onClick={() => requestSort('mexName')}>
                  <div className="flex items-center">Merchant Info {getSortIcon('mexName')}</div>
                </th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('basketSize')}>
                  <div className="flex items-center">Sales MTD {getSortIcon('basketSize')}</div>
                </th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('adsSpent')}>
                  <div className="flex items-center">Ads MTD {getSortIcon('adsSpent')}</div>
                </th>
                {/* ⚡ PERBAIKAN: Judul kolom diubah menjadi Limit MCA */}
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('mcaAmount')}>
                  <div className="flex items-center">Limit MCA {getSortIcon('mcaAmount')}</div>
                </th>
                <th className="px-2.5 py-3 sm:p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('campaignStatus')}>
                  <div className="flex items-center">Campaign {getSortIcon('campaignStatus')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm divide-y divide-slate-100">
              {processedData.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-slate-500 font-medium text-xs">Tidak ada data.</td></tr>
              ) : (
                processedData.map((merchant, index) => (
                  <tr key={merchant.id} onClick={() => navigate(`/merchant/${merchant.mexId}`)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-2.5 py-3 sm:p-4 text-center font-bold text-slate-400">{index + 1}</td>
                    
                    <td className="px-2.5 py-3 sm:p-4 max-w-[240px] sm:max-w-[320px] lg:max-w-[400px]">
                      <div 
                        className="font-black text-slate-800 text-[13px] sm:text-sm truncate" 
                        title={merchant.mexName} 
                      >
                        {merchant.mexName}
                      </div>
                      <div className="flex items-center gap-2 mt-1 overflow-hidden">
                        <span className="font-mono text-[9px] sm:text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 truncate shrink-0">{merchant.mexId}</span>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold shrink-0">
                          <UserCircle size={10} className="sm:w-3 sm:h-3"/> {merchant.shortAmName}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-2.5 py-3 sm:p-4"><div className="font-mono font-bold text-slate-700 text-xs sm:text-sm">{formatRupiah(merchant.basketSize)}</div></td>
                    <td className="px-2.5 py-3 sm:p-4">{merchant.adsSpent > 0 ? <div className="font-mono font-bold text-[#FF7A00] text-xs sm:text-sm">{formatRupiah(merchant.adsSpent)}</div> : <div className="font-mono font-medium text-slate-300">-</div>}</td>
                    
                    {/* ⚡ MENAMPILKAN LIMIT TERSEDIA DENGAN WARNA KHAS GRAB */}
                    <td className="px-2.5 py-3 sm:p-4">
                      {merchant.mcaAmount > 0 ? (
                        <div className="font-mono font-bold text-[#00B14F] text-xs sm:text-sm">{formatRupiah(merchant.mcaAmount)}</div>
                      ) : (
                        <div className="font-mono font-medium text-slate-300">-</div>
                      )}
                    </td>

                    <td className="px-2.5 py-3 sm:p-4">
                      <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold border ${getCampaignBadge(merchant.campaignStatus)}`}>
                        {merchant.campaignStatus}
                      </span>
                    </td>
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