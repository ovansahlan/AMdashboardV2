import React, { useMemo, useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { Users, UserCheck, UserMinus, AlertCircle, Search, Loader2 } from 'lucide-react';

export default function GMSTracker() {
  const { data, isLoading, error } = useSheetData('getDashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // 🧠 ENGINE PARSING KHUSUS GMS
  const gmsData = useMemo(() => {
    if (!data || data.length === 0) return { optIn: [], optOut: [], recentOptOuts: 0 };

    const optIn = [];
    const optOut = [];
    let recentOptOuts = 0;

    data.forEach((row) => {
      const mexName = row[4];
      if (!mexName || mexName === 'Mex Name' || mexName === '#N/A') return;

      const gmsPackage = row[47]; // Kolom AW: GMS Package
      const liveDate = row[48];   // Kolom AX: Live Date
      const optOutPackage = row[52]; // Kolom BB: Opt Out Package
      const optOutDate = row[53];    // Kolom BC: Opt Out Date

      // Cek apakah ada data Opt Out
      const isOptOut = optOutPackage && optOutPackage !== '0' && optOutPackage.trim() !== '';
      const isOptIn = gmsPackage && gmsPackage !== '0' && gmsPackage.trim() !== '';

      const merchantObj = {
        name: mexName,
        package: isOptOut ? optOutPackage : gmsPackage,
        date: isOptOut ? optOutDate : liveDate,
        sales: row[19] || '0', // Basketsize sebagai info tambahan
      };

      if (isOptOut) {
        optOut.push(merchantObj);
        // Anggap opt-out bulan ini (contoh logika notif)
        if (optOutDate && optOutDate.includes('2026')) recentOptOuts++;
      } else if (isOptIn) {
        optIn.push(merchantObj);
      }
    });

    return { optIn, optOut, recentOptOuts };
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-slate-900" size={32} />
        <p className="text-sm font-medium">Sinkronisasi status GMS...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  const { optIn, optOut, recentOptOuts } = gmsData;

  // Filter Search
  const filteredOptIn = optIn.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOptOut = optOut.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header & Notifikasi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">GMS Tracker</h1>
          <p className="text-slate-500 text-sm mt-0.5">Pantau status Opt-In dan churn (Opt-Out) merchant GMS.</p>
        </div>
        
        {/* Search Bar Minimalis */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari merchant..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Smart Notification Bar */}
      {recentOptOuts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Perhatian: Ada Merchant Churn</h4>
            <p className="text-xs text-amber-700 mt-0.5">Terdapat {recentOptOuts} merchant yang melakukan Opt-Out GMS baru-baru ini. Segera lakukan follow-up.</p>
          </div>
        </div>
      )}

      {/* KPI Cards Khusus GMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Opt-In</p>
              <h3 className="text-xl font-bold text-slate-950 mt-0.5">{optIn.length} <span className="text-sm font-normal text-slate-500">Merchant</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
              <UserMinus size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Opt-Out</p>
              <h3 className="text-xl font-bold text-slate-950 mt-0.5">{optOut.length} <span className="text-sm font-normal text-slate-500">Merchant</span></h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Komparatif */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Table Opt-In */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active GMS
            </h4>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm z-10">
                <tr>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Merchant Name</th>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOptIn.length > 0 ? filteredOptIn.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-800">{m.name}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {m.package || 'Standard'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="2" className="p-8 text-center text-slate-400">Tidak ada data ditemukan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Opt-Out */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div> Opt-Out / Churn
            </h4>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm z-10">
                <tr>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Merchant Name</th>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Opt-Out Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOptOut.length > 0 ? filteredOptOut.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-800">{m.name}</td>
                    <td className="p-3 text-slate-500 text-xs font-medium">{m.date || 'Unknown'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="2" className="p-8 text-center text-slate-400">Tidak ada merchant churn</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}