import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSheetData } from '../hooks/useSheetData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { ArrowLeft, Store, UserCircle, Wallet, Megaphone, ShoppingCart, Coins, Award, Loader2, AlertCircle, Calendar, CheckCircle2, Clock } from 'lucide-react';

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);
};

const formatShorthandNum = (num) => {
  if (!num || num === 0) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return `${num}`;
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

export default function MerchantDetail() {
  const { id } = useParams(); // Mengambil ID dari URL
  const navigate = useNavigate();
  const { data, isLoading, error } = useSheetData('getDashboard');

  // ENGINE: Mencari data spesifik untuk 1 Merchant
  const merchant = useMemo(() => {
    if (!data || data.length === 0 || !id) return null;

    let foundMerchant = null;

    data.forEach((row, index) => {
      const mexId = row[3] && row[3] !== '' ? row[3].toString().trim() : `MEX-${1000 + index}`;
      
      if (mexId === id) {
        const mexName = row[4] ? row[4].toString().split('-')[0].split(',')[0].trim() : 'Unknown Merchant';
        const amName = row[2] ? row[2].toString().trim() : 'Unassigned AM';
        
        const bsLM = parseNumber(row[18]);
        const bsMTD = parseNumber(row[19]);
        const bsRR = parseNumber(row[20]);
        
        const invMTD = parseNumber(row[23]);
        
        const adsLM = parseNumber(row[30]);
        const adsMTD = parseNumber(row[31]);
        
        const mcaStatus = row[39] ? row[39].toString().trim() : 'No Data';
        const mcaDate = row[40] ? row[40].toString().trim() : '-';
        const mcaAmount = parseNumber(row[41]);
        
        const campaignRaw = row[44] ? row[44].toString().trim() : '';
        const campaignStatus = parseCampaign(campaignRaw);
        const campaignPts = parseNumber(row[45]);

        foundMerchant = {
          mexId, mexName, amName,
          bsLM, bsMTD, bsRR, invMTD,
          adsLM, adsMTD,
          mcaStatus, mcaDate, mcaAmount,
          campaignRaw, campaignStatus, campaignPts
        };
      }
    });

    return foundMerchant;
  }, [data, id]);

  // Siapkan data untuk Mini Bar Chart
  const chartData = useMemo(() => {
    if (!merchant) return [];
    return [
      {
        name: 'Performa Sales & Ads',
        salesLM: merchant.bsLM,
        salesMTD: merchant.bsMTD,
        adsLM: merchant.adsLM,
        adsMTD: merchant.adsMTD,
      }
    ];
  }, [merchant]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50">
        <Loader2 className="animate-spin text-[#00B14F] mb-4" size={40} />
        <p className="text-slate-600 font-semibold tracking-wide">Membuka Profil Merchant...</p>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-3xl text-red-700 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <h2 className="text-xl font-black mb-2">Merchant Tidak Ditemukan</h2>
        <p className="font-medium text-red-600/80 mb-6">ID Merchant <b>{id}</b> tidak terdaftar dalam database saat ini.</p>
        <button onClick={() => navigate('/merchant')} className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-colors">
          Kembali ke Daftar Merchant
        </button>
      </div>
    );
  }

  // Tentukan warna badge Campaign
  const getCampaignBadge = (status) => {
    switch(status) {
      case 'GMS & Local': return 'bg-[#E5F7ED] text-[#00B14F] border-[#00B14F]/20';
      case 'GMS Only': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Local Only': return 'bg-[#FFF2E5] text-[#FF7A00] border-[#FF7A00]/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans space-y-6 animate-fadeIn">
      
      {/* --- HEADER NAVIGASI --- */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/merchant')}
          className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-[#00B14F] hover:text-[#00B14F] transition-all text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Merchant Profile</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Detail performa dan analitik toko spesifik.</p>
        </div>
      </div>

      {/* --- KARTU IDENTITAS MERCHANT --- */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00B14F]/5 rounded-bl-full -mr-10 -mt-10"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 bg-[#00B14F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00B14F]/20 shrink-0">
            <Store size={40} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{merchant.mexName}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 font-mono font-bold text-xs rounded-lg border border-slate-200">
                ID: {merchant.mexId}
              </span>
              <span className={`px-3 py-1 font-bold text-xs rounded-lg border ${getCampaignBadge(merchant.campaignStatus)}`}>
                {merchant.campaignStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 md:text-right relative z-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center md:justify-end gap-1.5 mb-1">
            <UserCircle size={14} /> Account Manager
          </span>
          <span className="text-base font-black text-slate-900">{merchant.amName}</span>
        </div>
      </div>

      {/* --- GRID 4 KPI UTAMA TOKO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-[#E5F7ED] rounded-2xl text-[#00B14F]"><ShoppingCart size={24} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Basket Size MTD</p>
            <p className="text-xl font-black text-slate-900">{formatRupiah(merchant.bsMTD)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-[#FFF2E5] rounded-2xl text-[#FF7A00]"><Megaphone size={24} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ads Spent MTD</p>
            <p className="text-xl font-black text-slate-900">{formatRupiah(merchant.adsMTD)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-[#E5F7ED] rounded-2xl text-[#00B14F]"><Coins size={24} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Merchant Invest</p>
            <p className="text-xl font-black text-slate-900">{formatRupiah(merchant.invMTD)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-[#E5F7ED] rounded-2xl text-[#00B14F]"><Award size={24} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Campaign Pts</p>
            <p className="text-xl font-black text-slate-900">{merchant.campaignPts} <span className="text-sm font-semibold text-slate-400">Pts</span></p>
          </div>
        </div>
      </div>

      {/* --- ROW CHARTS & DETAILS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAFIK PERBANDINGAN LM VS MTD UNTUK 1 TOKO INI */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="mb-6 w-full text-center border-b border-slate-100 pb-4">
            <h4 className="text-base font-black text-slate-900">Histori Performa</h4>
            <p className="text-xs text-slate-500 mt-1">Bulan Lalu vs MTD Berjalan</p>
          </div>
          <div className="h-[280px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 30, right: 0, left: 0, bottom: 0 }} barGap={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" hide />
                <YAxis hide type="number" />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" align="center" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                
                <Bar dataKey="salesLM" name="Sales LM" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={40} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="salesLM" position="top" formatter={formatShorthandNum} style={{ fontSize: 11, fill: '#6B7280', fontWeight: 'bold' }} />
                </Bar>
                <Bar dataKey="salesMTD" name="Sales MTD" fill="#00B14F" radius={[4, 4, 0, 0]} barSize={40} activeBar={false} style={{ outline: 'none' }}>
                  <LabelList dataKey="salesMTD" position="top" formatter={formatShorthandNum} style={{ fontSize: 12, fill: '#00B14F', fontWeight: '900' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DETAIL MCA & PROMO RAW */}
        <div className="space-y-6">
          
          {/* KARTU MCA */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="p-2 bg-[#E5F7ED] rounded-xl"><Wallet size={20} className="text-[#00B14F]" /></div>
              <h4 className="text-base font-black text-slate-900">Status Pencairan MCA</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Clock size={16}/> Status WL</span>
                {merchant.mcaStatus.toLowerCase() === 'disbursed' ? (
                  <span className="px-3 py-1 bg-[#E5F7ED] text-[#00B14F] font-bold text-xs rounded-lg flex items-center gap-1"><CheckCircle2 size={12}/> Disbursed</span>
                ) : merchant.mcaStatus.toLowerCase() === 'pending' ? (
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 font-bold text-xs rounded-lg">Pending</span>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 font-bold text-xs rounded-lg">No Status</span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Calendar size={16}/> Tanggal Cair</span>
                <span className="text-sm font-black text-slate-800">{merchant.mcaDate}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-sm font-bold text-slate-500">Nominal Cair</span>
                <span className="text-lg font-black text-[#00B14F]">{formatRupiah(merchant.mcaAmount)}</span>
              </div>
            </div>
          </div>

          {/* KARTU RAW CAMPAIGN */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="p-2 bg-[#FFF2E5] rounded-xl"><Megaphone size={20} className="text-[#FF7A00]" /></div>
              <h4 className="text-base font-black text-slate-900">Paket Promo Aktif</h4>
            </div>
            
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detail Promo (Raw Data)</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-mono text-slate-700 leading-relaxed">
                {merchant.campaignRaw && merchant.campaignRaw !== '-' && merchant.campaignRaw !== '0' 
                  ? merchant.campaignRaw.split('|').map((c, i) => <div key={i} className="mb-1">✅ {c.trim()}</div>)
                  : <span className="text-slate-400 italic">Merchant tidak mengikuti campaign apapun.</span>
                }
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}