import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, MonitorPlay, Users, ArrowRight, Store } from 'lucide-react'; // ⚡ Ganti Presentation dengan MonitorPlay

export default function Home() {
  const navigate = useNavigate();

  const portals = [
    {
      title: 'Internal Analytical Dashboard',
      desc: 'Monitoring pencapaian OKR, pergerakan iklan AM, status kesehatan omset, dan log pencairan dana modal MCA harian.',
      icon: <LayoutDashboard size={28} className="text-[#00B14F]" />,
      path: '/dashboard',
      badge: 'Internal AM Only',
      badgeColor: 'bg-[#E5F7ED] text-[#00B14F]'
    },
    {
      title: 'Merchant Presentation Deck',
      desc: 'Mode visualisasi khusus untuk pitching ke pemilik resto. Menampilkan performa omset 6 bulan, AOV, GrabAds harian, dan rasio promo.',
      icon: <MonitorPlay size={28} className="text-purple-600" />, // ⚡ Diubah ke MonitorPlay
      path: '/present', 
      badge: 'Merchant Pitching',
      badgeColor: 'bg-purple-50 text-purple-600 border border-purple-100'
    },
    {
      title: 'Merchant Master Database',
      desc: 'Eksplorasi basis data terpadu seluruh outlet aktif, pencarian MEX ID, filter wilayah manajer, dan sisa kuota limit MCA.',
      icon: <Users size={28} className="text-amber-500" />,
      path: '/merchant',
      badge: 'Database Master',
      badgeColor: 'bg-amber-50 text-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#00B14F]/10">
      <div className="w-full max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm mb-2">
            <div className="w-6 h-6 bg-[#00B14F] rounded-lg flex items-center justify-center">
              <Store size={14} className="text-white" />
            </div>
            <span className="text-xs font-black text-slate-800 tracking-wide uppercase">GrabFood AM WebPortal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Selamat Datang di Grab<span className="text-[#00B14F]">Metrics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            Pilih portal tujuan Anda untuk mulai menganalisis performa toko, memantau retensi iklan, atau mempersiapkan materi meeting mitra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {portals.map((portal, index) => (
            <button
              key={index}
              onClick={() => navigate(portal.path)}
              className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] text-left flex flex-col justify-between hover:border-[#00B14F] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-[240px] sm:h-[280px] relative overflow-hidden outline-none"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                    {portal.icon}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${portal.badgeColor}`}>
                    {portal.badge}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-[#00B14F] transition-colors line-clamp-1">
                  {portal.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed line-clamp-4 sm:line-clamp-5">
                  {portal.desc}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-[#00B14F] mt-4 pt-3 border-t border-slate-50 w-full justify-between group-hover:gap-2 transition-all">
                <span>Masuk Portal</span>
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
        <div className="text-center text-[10px] font-bold text-slate-400 tracking-wider uppercase pt-4">
          GrabMetrics Engine © 2026 • Secure AM Environment
        </div>
      </div>
    </div>
  );
}