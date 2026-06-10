import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSheetData } from '../hooks/useSheetData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { ArrowLeft, Store, UserCircle, Wallet, Megaphone, ShoppingCart, Coins, Award, Loader2, AlertCircle, Calendar, CheckCircle2, Clock, MapPin, ExternalLink, MessageCircle, Copy } from 'lucide-react';

// ==========================================
// 1. HELPER FUNCTIONS
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
  if (str.includes('booster+') || str.includes('booster +')) return 'Booster+';
  const hasGMS = str.includes('gms booster') || str.includes('gms cuan');
  const hasLocal = str.split('|').some(p => !p.trim().includes('gms booster') && !p.trim().includes('gms cuan') && !p.trim().includes('booster+'));

  if (hasGMS && hasLocal) return 'GMS & Local';
  if (hasGMS && !hasLocal) return 'GMS Only';
  if (!hasGMS && hasLocal) return 'Local Only';
  return 'Zero Campaign';
};

const getWhatsAppLink = (phoneStr) => {
  if (!phoneStr || phoneStr === '-') return '';
  let cleanNumber = phoneStr.toString().replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) cleanNumber = '62' + cleanNumber.substring(1);
  return `https://wa.me/${cleanNumber}`;
};

// ⚡ REVISI CHART: Samakan fungsi label agar tegak lurus presisi di tengah Bar sesuai standar dashboard
const renderCustomBarLabel = (props, color, fontSize) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text 
      x={x + width / 2} 
      y={y - 12} 
      fill={color} 
      fontSize={fontSize} 
      fontWeight="900" 
      textAnchor="start" 
      dominantBaseline="central" 
      transform={`rotate(-90, ${x + width / 2}, ${y - 12})`} 
      style={{ pointerEvents: 'none', outline: 'none' }}
    >
      {formatShorthandNum(value)}
    </text>
  );
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function MerchantDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { data, isLoading, error } = useSheetData('getDashboard');
  const [copiedField, setCopiedField] = useState('');

  const handleCopyShortcut = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000); 
  };

  const merchant = useMemo(() => {
    if (!data || data.length === 0 || !id) return null;
    let foundMerchant = null;

    data.forEach((row, index) => {
      const mexId = row[3] && row[3] !== '' ? row[3].toString().trim() : `MEX-${1000 + index}`;
      
      if (mexId === id) {
        const mexName = row[4] ? row[4].toString().trim() : 'Unknown Merchant';
        const amName = row[2] ? row[2].toString().trim() : 'Unassigned AM';
        
        const bsLM = parseNumber(row[18]);
        const bsMTD = parseNumber(row[19]);
        const bsRR = parseNumber(row[20]);
        const invMTD = parseNumber(row[23]);
        const adsLM = parseNumber(row[30]);
        const adsMTD = parseNumber(row[31]);
        const mcaStatus = row[39] ? row[39].toString().trim() : 'No Data';
        const mcaDate = row[40] ? row[40].toString().trim() : '-';
        const mcaAmount = parseNumber(row[37]); // Berpedoman pada Kolom AL (Limit MCA)
        const campaignRaw = row[44] ? row[44].toString().trim() : '';
        const campaignStatus = parseCampaign(campaignRaw);
        const campaignPts = parseNumber(row[45]);

        const address = row[9] ? row[9].toString().trim() : '';      
        const ownerName = row[10] ? row[10].toString().trim() : '';  
        const phone = row[11] ? row[11].toString().trim() : '';      
        const email = row[12] ? row[12].toString().trim() : '';      
        const baseComm = row[13] ? row[13].toString().trim() : '';   
        const latitude = row[14] ? row[14].toString().trim() : '';   
        const longitude = row[15] ? row[15].toString().trim() : '';  

        foundMerchant = {
          mexId, mexName, amName, bsLM, bsMTD, bsRR, invMTD, adsLM, adsMTD,
          mcaStatus, mcaDate, mcaAmount, campaignRaw, campaignStatus, campaignPts,
          address, ownerName, phone, email, baseComm, latitude, longitude
        };
      }
    });
    return foundMerchant;
  }, [data, id]);

  const chartData = useMemo(() => {
    if (!merchant) return [];
    return [{
      name: 'Komparasi MTD Berjalan',
      salesLM: merchant.bsLM,
      salesMTD: merchant.bsMTD,
      adsLM: merchant.adsLM,
      adsMTD: merchant.adsMTD,
    }];
  }, [merchant]);

  if (isLoading) return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-[#00B14F]" size={36} /></div>;
  
  if (error || !merchant) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <AlertCircle size={48} className="mb-4 text-red-400" />
      <h2 className="text-xl font-black mb-2">Merchant Tidak Ditemukan</h2>
      <button onClick={() => navigate('/merchant')} className="mt-4 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors">Kembali</button>
    </div>
  );

  const getCampaignBadge = (status) => {
    switch(status) {
      case 'Booster+': return 'bg-[#F4F0FF] text-[#7E22CE] border-[#7E22CE]/20';
      case 'GMS & Local': return 'bg-[#E5F7ED] text-[#00B14F] border-[#00B14F]/20';
      case 'GMS Only': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Local Only': return 'bg-[#FFF2E5] text-[#FF7A00] border-[#FF7A00]/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="bg-[#F7F9FA] min-h-full space-y-3 sm:space-y-6 -mx-2 sm:mx-0 animate-fadeIn pb-8">
      
      {/* --- HEADER NAVIGASI --- */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4 mx-2 sm:mx-0">
        <button 
          onClick={() => navigate('/merchant')}
          className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm hover:border-[#00B14F] hover:text-[#00B14F] transition-all text-slate-500 shrink-0"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Merchant Profile</h1>
          <p className="text-[10px] sm:text-sm text-slate-500 font-medium mt-0.5">Detail performa dan informasi operasional toko.</p>
        </div>
      </div>

      {/* --- KARTU IDENTITAS HERO (⚡ REVISI FONT SIZING: Diperkecil agar proporsional) --- */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden mx-2 sm:mx-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B14F]/5 rounded-bl-full -mr-10 -mt-10"></div>
        
        <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full md:w-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#00B14F] rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Store size={24} className="text-white sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 group flex-wrap">
              {/* Sizing diturunkan dari text-3xl menjadi text-xl sm:text-2xl */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">{merchant.mexName}</h2>
              <button 
                onClick={() => handleCopyShortcut(merchant.mexName, 'name')}
                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-[#00B14F] rounded-lg transition-all"
              >
                {copiedField === 'name' ? <CheckCircle2 size={13} className="text-[#00B14F]" /> : <Copy size={13} />}
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 font-mono font-bold text-[10px] sm:text-xs rounded-md border border-slate-200 flex items-center gap-1.5">
                ID: {merchant.mexId}
                <button onClick={() => handleCopyShortcut(merchant.mexId, 'id')} className="hover:bg-slate-200 text-slate-400 hover:text-[#00B14F] rounded transition-all">
                  {copiedField === 'id' ? <CheckCircle2 size={11} className="text-[#00B14F]" /> : <Copy size={11} />}
                </button>
              </span>
              <span className={`px-2 py-0.5 font-bold text-[10px] sm:text-xs rounded-md border ${getCampaignBadge(merchant.campaignStatus)}`}>
                {merchant.campaignStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 md:text-right relative z-10 p-3 bg-slate-50 rounded-xl border border-slate-100 w-full md:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center md:justify-end gap-1.5">
            <UserCircle size={12} /> Account Manager
          </span>
          <span className="text-sm font-black text-slate-900">{merchant.amName}</span>
        </div>
      </div>

      {/* --- GRID 4 KPI CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-2 sm:px-0">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-[#E5F7ED] text-[#00B14F] rounded-xl"><ShoppingCart size={18} /></div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Basket MTD</p>
            <p className="text-sm sm:text-base font-black text-slate-900">{formatRupiah(merchant.bsMTD)}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-[#FFF2E5] text-[#FF7A00] rounded-xl"><Megaphone size={18} /></div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Ads MTD</p>
            <p className="text-sm sm:text-base font-black text-slate-900">{formatRupiah(merchant.adsMTD)}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-[#E5F7ED] text-[#00B14F] rounded-xl"><Coins size={18} /></div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Invest MTD</p>
            <p className="text-sm sm:text-base font-black text-slate-900">{formatRupiah(merchant.invMTD)}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-[#E5F7ED] text-[#00B14F] rounded-xl"><Award size={18} /></div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Camp Points</p>
            <p className="text-sm sm:text-base font-black text-slate-900">{merchant.campaignPts}</p>
          </div>
        </div>
      </div>

      {/* --- CHART PERBANDINGAN (⚡ REVISI LAYOUT: Diselaraskan dengan Dashboard) --- */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center mx-2 sm:mx-0">
        <div className="mb-4 sm:mb-6 w-full text-center border-b border-slate-100 pb-3 sm:pb-4">
          <h4 className="text-sm sm:text-base font-black text-slate-900">Histori Performa</h4>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Bulan Lalu vs MTD Berjalan</p>
        </div>
        {/* Mengunci outline, select-none, dan menyuntikkan headroom top: 70 agar teks tidak bertabrakan */}
        <div className="h-[250px] sm:h-[350px] w-full flex justify-center select-none [&_*]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 70, right: 10, left: -20, bottom: 0 }} barGap={12}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" hide />
              <YAxis hide type="number" />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Legend verticalAlign="top" align="center" height={40} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', top: -10 }} />
              
              <Bar dataKey="salesLM" name="Sales LM" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList dataKey="salesLM" content={(props) => renderCustomBarLabel(props, '#6B7280', 8)} />
              </Bar>
              <Bar dataKey="salesMTD" name="Sales MTD" fill="#00B14F" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList dataKey="salesMTD" content={(props) => renderCustomBarLabel(props, '#00B14F', 9)} />
              </Bar>
              <Bar dataKey="adsLM" name="Ads LM" fill="#FDBA74" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList dataKey="adsLM" content={(props) => renderCustomBarLabel(props, '#C2410C', 8)} />
              </Bar>
              <Bar dataKey="adsMTD" name="Ads MTD" fill="#FF7A00" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList dataKey="adsMTD" content={(props) => renderCustomBarLabel(props, '#FF7A00', 9)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- 3 TABS KOLOM BAWAH (⚡ REVISI ORDER MOBILE & SCROLL PROMO) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 px-2 sm:px-0">
        
        {/* KOLOM 1: LOKASI & KONTAK (⚡ REVISI ORDER: order-3 membuat kolom lokasi turun paling bawah di HP) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col h-full order-3 md:order-1">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-[#E5F7ED] text-[#00B14F] rounded-lg"><MapPin size={16} /></div>
            <h4 className="text-sm font-black text-slate-900">Info Owner & Lokasi</h4>
          </div>
          
          <div className="space-y-3.5 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Nama Owner</span>
                <p className="text-xs font-black text-slate-800">{merchant.ownerName || '-'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Komisi (Comm)</span>
                <p className="text-xs font-black text-slate-800">{merchant.baseComm || '-'}</p>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Email Aktif</span>
              <p className="text-xs font-bold text-slate-800 truncate" title={merchant.email}>{merchant.email || '-'}</p>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alamat Outlet</span>
              {merchant.latitude && merchant.longitude && merchant.latitude !== '-' ? (
                <a 
                  href={`https://maps.google.com/?q=${merchant.latitude},${merchant.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-700 hover:text-[#00B14F] flex items-start justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#00B14F]/20 group transition-all"
                >
                  <span className="underline decoration-dotted group-hover:decoration-solid flex-1">{merchant.address || 'Buka di Google Maps'}</span>
                  <ExternalLink size={12} className="text-slate-400 group-hover:text-[#00B14F] mt-0.5 shrink-0" />
                </a>
              ) : (
                <div className="p-2 bg-slate-50 rounded-xl border text-xs font-medium text-slate-700">{merchant.address || 'Detail alamat tidak tersedia'}</div>
              )}
            </div>
            
            <div className="pt-2 border-t border-slate-50 mt-auto">
              {merchant.phone && merchant.phone !== '-' && merchant.phone !== '0' ? (
                <a 
                  href={getWhatsAppLink(merchant.phone)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E5F7ED] text-[#00B14F] hover:bg-[#00B14F] hover:text-white font-black text-xs rounded-xl border border-[#00B14F]/10 transition-all shadow-sm w-full group"
                >
                  <MessageCircle size={14} className="transition-transform group-hover:scale-110" />
                  <span>Hubungi Partner ({merchant.phone})</span>
                </a>
              ) : (
                <p className="text-xs font-bold text-slate-400 italic bg-slate-50 p-2 rounded-xl text-center">Kontak telepon tidak tersedia</p>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM 2: MCA STATUS (order-1 di mobile, tampil pertama di bawah chart) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col h-full order-1 md:order-2">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-[#E5F7ED] text-[#00B14F] rounded-lg"><Wallet size={16} /></div>
            <h4 className="text-sm font-black text-slate-900">Limit & Status MCA</h4>
          </div>
          
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock size={13}/> Status Ops</span>
              {merchant.mcaStatus.toLowerCase() === 'disbursed' ? (
                <span className="px-2 py-0.5 bg-[#E5F7ED] text-[#00B14F] font-bold text-[10px] rounded-md flex items-center gap-1"><CheckCircle2 size={11}/> Disbursed</span>
              ) : merchant.mcaStatus.toLowerCase().includes('pending') ? (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 font-bold text-[10px] rounded-md">Pending</span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-md">No Status</span>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Calendar size={13}/> Tanggal Cair</span>
              <span className="text-xs font-black text-slate-800">{merchant.mcaDate || '-'}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
              <span className="text-xs font-bold text-slate-500">Limit Tersedia (AL)</span>
              <span className="text-base font-black text-[#00B14F]">{formatRupiah(merchant.mcaAmount)}</span>
            </div>
          </div>
        </div>

        {/* KOLOM 3: CAMPAIGN MIX (⚡ REVISI BOX SCROLL: Anti-Ceklis Kosong & Dilengkapi Scrollbar) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col h-full order-2 md:order-3">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-[#FFF2E5] text-[#FF7A00] rounded-lg"><Megaphone size={16} /></div>
            <h4 className="text-sm font-black text-slate-900">Paket Promo Aktif</h4>
          </div>
          
          <div className="flex-1 flex flex-col">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Daftar Ikut Serta Campaign</p>
            
            {/* Mengunci tinggi maksimal kotak di 150px dan memberikan scrollbar vertikal otomatis */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono text-slate-700 leading-relaxed max-h-[150px] overflow-y-auto space-y-1.5">
              {merchant.campaignRaw && merchant.campaignRaw !== '-' && merchant.campaignRaw !== '0' ? (
                merchant.campaignRaw
                  .split('|')
                  // Logika Filter untuk menendang spasi/ceklis kosong keluar dari tabel
                  .filter(c => c && c.trim() !== '') 
                  .map((c, i) => (
                    <div key={i} className="break-words font-semibold text-slate-700">
                      ✅ {c.trim()}
                    </div>
                  ))
              ) : (
                <span className="text-slate-400 italic">Merchant tidak mengikuti program promosi apapun.</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}