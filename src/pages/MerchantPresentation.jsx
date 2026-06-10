import React, { useState, useMemo, useContext } from 'react'; 
import { useSheetData } from '../hooks/useSheetData';
import { GlobalFilterContext } from '../context/GlobalContext'; 
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { Loader2, AlertCircle, Award, Store, UserCircle, Megaphone, ShoppingCart, Calendar, CheckCircle2, TrendingUp, MonitorPlay, Users, Percent, DollarSign } from 'lucide-react'; // ⚡ Menggunakan MonitorPlay

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);

// Normalisasi pembacaan teks bulan Indonesia ke format standar Javascript Date
const safeParseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0);
  let cleanStr = dateStr.trim().toLowerCase()
    .replace('januari', 'january').replace('februari', 'february').replace('maret', 'march')
    .replace('mei', 'may').replace('juni', 'june').replace('juli', 'july')
    .replace('agustus', 'august').replace('oktober', 'october').replace('desember', 'december');
  if (cleanStr === '-' || cleanStr === '0' || cleanStr === '#n/a' || cleanStr === 'n/a' || cleanStr === '') return new Date(0);
  const parsed = Date.parse(cleanStr);
  return isNaN(parsed) ? new Date(0) : new Date(parsed);
};

const renderCustomBarLabel = (props, color, fontSize) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 12} fill={color} fontSize={fontSize} fontWeight="900" textAnchor="start" dominantBaseline="central" transform={`rotate(-90, ${x + width / 2}, ${y - 12})`} style={{ pointerEvents: 'none' }}>
      {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
    </text>
  );
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
        list.push({ id: row[3] || name, name: name.split('-')[0].split(',')[0].trim(), fullName: name });
      }
    });
    return list;
  }, [dashboardData, selectedAm]);

  React.useEffect(() => {
    if (merchantOptions.length > 0) {
      const looksFound = merchantOptions.some(m => m.fullName === selectedMex);
      if (!looksFound) setSelectedMex(merchantOptions[0].fullName);
    } else {
      setSelectedMex('');
    }
  }, [merchantOptions, selectedMex]);

  const profile = useMemo(() => {
    if (!selectedMex || !dashboardData || !historisData || !dailyData) return null;

    const dashRow = dashboardData.find(r => r[4] === selectedMex);
    let bsMTD = 0, adsMTD = 0, amName = 'Unassigned', mexId = '-', campaignRaw = '', campPts = '0';
    
    if (dashRow) {
      amName = dashRow[2]; mexId = dashRow[3];
      bsMTD = parseFloat(dashRow[19]?.toString().replace(/,/g, '')) || 0;
      adsMTD = parseFloat(dashRow[31]?.toString().replace(/,/g, '')) || 0;
      campaignRaw = dashRow[44] || ''; campPts = dashRow[45] || '0';
    }

    const histRow = Array.isArray(historisData) ? historisData.find(r => r[0] === selectedMex) : null;
    let historyChart = [], promoUsage = '-', aov = 0;
    
    if (histRow) {
      promoUsage = histRow[13] || '-'; aov = parseFloat(histRow[14]) || 0;
      historyChart = [
        { month: 'Jan', 'Basket Size': parseFloat(histRow[1]) || 0 },
        { month: 'Feb', 'Basket Size': parseFloat(histRow[2]) || 0 },
        { month: 'Mar', 'Basket Size': parseFloat(histRow[3]) || 0 },
        { month: 'Apr', 'Basket Size': parseFloat(histRow[4]) || 0 },
        { month: 'May', 'Basket Size': parseFloat(histRow[5]) || 0 },
        { month: 'Bulan Ini', 'Basket Size': bsMTD / 1e6 }, 
      ];
    }

    const dailyChart = Array.isArray(dailyData) 
      ? dailyData.filter(r => r[1] === selectedMex).map(r => ({
            day: r[0]?.split('-')[2] ? `Tgl ${r[0].split('-')[2]}` : r[0],
            'Orders': parseInt(r[2]) || 0, 'Ads Spent': parseFloat(r[3]) || 0
          }))
      : [];

    return { cleanName: selectedMex.split('-')[0].split(',')[0].trim(), mexId, amName, bsMTD, adsMTD, campaignRaw, campPts, promoUsage, aov, historyChart, dailyChart };
  }, [selectedMex, dashboardData, historisData, dailyData]);

  const isLoading = loadDash || loadHist || loadDaily;
  const anyError = errDash || errHist || errDaily;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] items-center gap-3">
        <Loader2 className="animate-spin text-[#00B14F]" size={40} />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mengkonsolidasikan Data Multi-Tab...</p>
      </div>
    );
  }

  if (anyError) {
    return <div className="p-4 m-4 bg-red-50 text-red-700 font-bold rounded-xl text-xs flex items-center gap-2"><AlertCircle size={16} /><span>Gagal memuat data: {anyError.toString()}</span></div>;
  }

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-4 sm:space-y-6 -mx-2 sm:mx-0 select-none [&_*]:outline-none">
      <div className="bg-white p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#00B14F] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#00B14F]/10">
            <MonitorPlay size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900">Pitching Deck Mode</h1>
            <p className="text-[10px] sm:text-xs font-bold text-[#00B14F] uppercase tracking-wider">Presentasi Kinerja Khusus Partner Resto</p>
          </div>
        </div>
        <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-2 focus-within:border-[#00B14F] transition-colors">
          <Store size={16} className="text-slate-400 shrink-0" />
          <select value={selectedMex} onChange={(e) => setSelectedMex(e.target.value)} className="text-xs sm:text-sm font-black text-slate-800 bg-transparent outline-none cursor-pointer w-full">
            {merchantOptions.length === 0 ? <option value="">Tidak ada merchant</option> : merchantOptions.map(m => <option key={m.id} value={m.fullName}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {profile ? (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-[#00B14F]/5 -mr-4 -mb-4"><ShoppingCart size={100}/></div>
              <div className="p-3 bg-[#E5F7ED] text-[#00B14F] rounded-2xl"><ShoppingCart size={24} /></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Basket Size MTD</span><h3 className="text-lg sm:text-2xl font-black text-slate-900">{formatRupiah(profile.bsMTD)}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-[#FF7A00]/5 -mr-4 -mb-4"><DollarSign size={100}/></div>
              <div className="p-3 bg-[#FFF2E5] text-[#FF7A00] rounded-2xl"><DollarSign size={24} /></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nilai Tiket (AOV)</span><h3 className="text-lg sm:text-2xl font-black text-slate-900">{formatRupiah(profile.aov)}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-blue-500/5 -mr-4 -mb-4"><Percent size={100}/></div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Percent size={24} /></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rasio Promo MTD</span><h3 className="text-lg sm:text-2xl font-black text-slate-900">{profile.promoUsage}</h3></div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
            <div className="mb-6 border-b border-slate-100 pb-3 text-center"><h4 className="text-sm sm:text-base font-black text-slate-900">Histori Omset 6 Bulan Terakhir</h4></div>
            <div className="h-[250px] sm:h-[320px] w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profile.historyChart} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="Basket Size" fill="#00B14F" radius={[6, 6, 0, 0]} barSize={32}>
                    <LabelList dataKey="Basket Size" position="top" content={(props) => renderCustomBarLabel(props, '#00B14F', 10)} />
                  </Bar>
                </BarChart>
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
                  profile.campaignRaw.split('|').map((c, i) => <span key={i} className="px-3 py-2 bg-[#E5F7ED] text-[#00B14F] border border-[#00B14F]/10 text-xs font-black rounded-xl">✅ {c.trim()}</span>)
                ) : <span className="text-slate-400 italic text-xs">Tidak ada program promosi aktif.</span>}
              </div>
            </div>
          </div>
        </div>
      ) : <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs font-bold italic">Silakan pilih merchant untuk memulai presentasi.</div>}
    </div>
  );
}