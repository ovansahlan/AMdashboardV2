import React, { useMemo, useState } from 'react';
// ⚡ PERBAIKAN: useNavigate sudah ditambahkan di sini
import { useNavigate } from 'react-router-dom'; 
import { useSheetData } from '../hooks/useSheetData';
import { Loader2, AlertCircle, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, Store } from 'lucide-react';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);
};

const parseNumber = (val) => {
  if (!val || val === '-' || val.toString().trim() === '' || val === '#N/A') return 0;
  const cleanStr = val.toString().replace(/,/g, '').replace(/Rp/g, '').trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

const parseCampaign = (val) => {
  if (!val || typeof val !== 'string' || val.trim() === '' || val === '0' || val === '-' || val.toLowerCase().includes('no campaign') || val === '#n/a') {
    return 'Zero Campaign';
  }
  const str = val.toLowerCase();
  const hasGMS = str.includes('gms booster') || str.includes('gms cuan');
  const parts = str.split('|').map(s => s.trim()).filter(s => s !== '');
  const hasLocal = parts.some(p => !p.includes('gms booster') && !p.includes('gms cuan'));

  if (hasGMS && hasLocal) return 'GMS & Local';
  if (hasGMS && !hasLocal) return 'GMS Only';
  if (!hasGMS && hasLocal) return 'Local Only';
  return 'Zero Campaign';
};

export default function MerchantList() {
  const { data, isLoading, error } = useSheetData('getDashboard');
  const navigate = useNavigate(); // ⚡ PERBAIKAN: Engine navigasi diaktifkan
  
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'basketSize', direction: 'desc' });

  const merchants = useMemo(() => {
    if (!data || data.length === 0) return [];

    const rawList = [];
    data.forEach((row, index) => {
      const mexName = row[4];
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A') return;

      const mexId = row[3] && row[3] !== '' ? row[3] : `MEX-${1000 + index}`; 
      const basketSize = parseNumber(row[19]);
      const adsSpent = parseNumber(row[31]);
      const mcaAmount = parseNumber(row[41]); 
      const campaignStatus = parseCampaign(row[44]);

      let cleanName = mexName.split('-')[0].split(',')[0].trim();

      rawList.push({
        id: index,
        mexId: mexId.toString().trim(),
        mexName: cleanName,
        basketSize,
        adsSpent,
        mcaAmount,
        campaignStatus
      });
    });

    return rawList;
  }, [data]);

  const processedData = useMemo(() => {
    let filtered = [...merchants];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.mexName.toLowerCase().includes(lowerSearch) || 
        m.mexId.toLowerCase().includes(lowerSearch)
      );
    }

    if (campaignFilter !== 'All') {
      filtered = filtered.filter(m => m.campaignStatus === campaignFilter);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }

        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }, [merchants, searchTerm, campaignFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'; 
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-[#00B14F] font-bold" /> 
      : <ChevronDown size={14} className="text-[#00B14F] font-bold" />;
  };

  const getCampaignBadge = (status) => {
    switch(status) {
      case 'GMS & Local': return 'bg-[#E5F7ED] text-[#00B14F] border-[#00B14F]/20';
      case 'GMS Only': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Local Only': return 'bg-[#FFF2E5] text-[#FF7A00] border-[#FF7A00]/20';
      case 'Zero Campaign': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50">
        <Loader2 className="animate-spin text-[#00B14F] mb-4" size={40} />
        <p className="text-slate-600 font-semibold tracking-wide">Memuat Database Merchant...</p>
      </div>
    );
  }

  if (error || !merchants.length) {
    return (
      <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
        <AlertCircle size={24} />
        <p className="font-medium">Gagal memuat data merchant: {error || 'Data kosong'}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans space-y-6">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#00B14F] rounded-xl flex items-center justify-center">
            <Store size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Merchant Database</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Pantau dan kelola performa toko secara spesifik.</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Total Filter:</span>
          <span className="text-base font-black text-[#00B14F]">{processedData.length}</span>
          <span className="text-xs font-semibold text-slate-400">Toko</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-[#00B14F] transition-colors">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Nama Merchant atau Mex ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
          <Filter size={18} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-500 hidden sm:block">Status Promo:</span>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="text-sm font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="All">Semua Campaign</option>
            <option value="GMS & Local">GMS & Local</option>
            <option value="GMS Only">GMS Only</option>
            <option value="Local Only">Local Only</option>
            <option value="Zero Campaign">Zero Campaign</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="p-4 w-12 text-center font-bold">No</th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('mexName')}>
                  <div className="flex items-center gap-2">Merchant Info {getSortIcon('mexName')}</div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('basketSize')}>
                  <div className="flex items-center gap-2">Basket Size MTD {getSortIcon('basketSize')}</div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('adsSpent')}>
                  <div className="flex items-center gap-2">Ads Spent MTD {getSortIcon('adsSpent')}</div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('mcaAmount')}>
                  <div className="flex items-center gap-2">Nilai MCA (WL) {getSortIcon('mcaAmount')}</div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('campaignStatus')}>
                  <div className="flex items-center gap-2">Status Campaign {getSortIcon('campaignStatus')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">
                    Tidak ada merchant yang cocok dengan pencarian/filter ini.
                  </td>
                </tr>
              ) : (
                processedData.map((merchant, index) => (
                  // ⚡ PERBAIKAN: Klik pada baris akan membuka halaman Merchant Detail
                  <tr 
                    key={merchant.id} 
                    onClick={() => navigate(`/merchant/${merchant.mexId}`)}
                    className="hover:bg-slate-100 transition-colors group cursor-pointer"
                  >
                    <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="p-4">
                      <div className="font-black text-slate-800">{merchant.mexName}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">{merchant.mexId}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-700">{formatRupiah(merchant.basketSize)}</div>
                    </td>
                    <td className="p-4">
                      {merchant.adsSpent > 0 ? (
                        <div className="font-mono font-bold text-[#FF7A00]">{formatRupiah(merchant.adsSpent)}</div>
                      ) : (
                        <div className="font-mono font-medium text-slate-300">-</div>
                      )}
                    </td>
                    <td className="p-4">
                      {merchant.mcaAmount > 0 ? (
                        <div className="font-mono font-bold text-[#00B14F]">{formatRupiah(merchant.mcaAmount)}</div>
                      ) : (
                        <div className="font-mono font-medium text-slate-300">-</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold border ${getCampaignBadge(merchant.campaignStatus)}`}>
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