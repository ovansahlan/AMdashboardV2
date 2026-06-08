import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, Settings, ArrowRight, Store } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  // Data Modul Aplikasi (Bisa ditambah seiring bertambahnya fitur)
  const appModules = [
    {
      title: 'Main Dashboard',
      description: 'Analisis komprehensif performa Sales, Ads, dan Health Merchant MTD.',
      icon: <LayoutDashboard size={28} />,
      path: '/dashboard',
      color: 'text-[#00B14F]',
      bgColor: 'bg-[#E5F7ED]',
      active: true,
    },
    {
      title: 'Merchant Database',
      description: 'Manajemen data detail toko, riwayat pencairan MCA, dan profil AM.',
      icon: <Users size={28} />,
      path: '/merchant',
      color: 'text-[#FF7A00]',
      bgColor: 'bg-[#FFF2E5]',
      active: false, // Set false karena fiturnya belum kita buat
    },
    {
      title: 'Campaign Manager',
      description: 'Pantau partisipasi GMS Booster, Cuan, dan promo lokal lainnya.',
      icon: <Megaphone size={28} />,
      path: '/campaign',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FA] font-sans flex flex-col items-center justify-center p-6">
      
      {/* HEADER PORTAL */}
      <div className="text-center mb-12 animate-fadeIn">
        <div className="w-20 h-20 bg-[#00B14F] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#00B14F]/20 mb-6">
          <Store size={40} className="text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          GrabFood <span className="text-[#00B14F]">Portal</span>
        </h1>
        <p className="text-slate-500 font-medium mt-3 max-w-md mx-auto">
          Pusat kendali operasional dan analitik portfolio Merchant. Pilih modul aplikasi di bawah untuk memulai.
        </p>
      </div>

      {/* GRID MENU MODUL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl animate-fadeIn">
        {appModules.map((module, index) => (
          <button
            key={index}
            onClick={() => module.active ? navigate(module.path) : alert('Fitur ini sedang dalam tahap pengembangan! 🚀')}
            className={`text-left p-6 rounded-3xl border transition-all duration-300 group relative overflow-hidden ${
              module.active 
                ? 'bg-white border-slate-200 hover:border-[#00B14F] shadow-sm hover:shadow-md cursor-pointer' 
                : 'bg-slate-50 border-slate-100 opacity-70 cursor-not-allowed'
            }`}
          >
            <div className="flex flex-col h-full relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${module.bgColor} ${module.color}`}>
                {module.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{module.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                {module.description}
              </p>
              
              <div className="flex items-center gap-2 mt-auto">
                <span className={`text-sm font-bold ${module.active ? 'text-[#00B14F]' : 'text-slate-400'}`}>
                  {module.active ? 'Buka Modul' : 'Coming Soon'}
                </span>
                {module.active && <ArrowRight size={16} className="text-[#00B14F] transition-transform group-hover:translate-x-1" />}
              </div>
            </div>

            {/* Efek aksen Grab Green di pojok jika aktif */}
            {module.active && (
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#00B14F]/5 rounded-full transition-transform group-hover:scale-150"></div>
            )}
          </button>
        ))}
      </div>

      {/* FOOTER */}
      <div className="mt-16 text-center text-xs font-semibold text-slate-400">
        <p>© 2026 GrabMetrics Internal Tools. Secured & Encrypted.</p>
      </div>
    </div>
  );
}