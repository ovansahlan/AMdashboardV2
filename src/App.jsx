import React, { useState, useMemo, useCallback, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Store, Megaphone, Target, ArrowLeft, Menu, X } from 'lucide-react';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MerchantList from './pages/MerchantList';
import MerchantDetail from './pages/MerchantDetail';
import GMSTracker from './pages/GMSTracker';
import AdsTracker from './pages/AdsTracker';
export const TimeMachineContext = createContext();
export const GlobalFilterContext = createContext();

const OKRTracker = () => <div className="p-6 text-slate-800 font-medium">OKR Tracker View</div>;

const SidebarContent = ({ onClose }) => {
  const menuItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/merchant', icon: <Users size={20} />, label: 'Merchant List' },
    { path: '/gms', icon: <Megaphone size={20} />, label: 'Campaign Tracker' },
    { path: '/ads', icon: <Target size={20} />, label: 'Ads Tracker' },
    { path: '/okr', icon: <Target size={20} />, label: 'OKR Target' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#00B14F] rounded-xl flex items-center justify-center shadow-sm shadow-[#00B14F]/20">
            <Store size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Grab<span className="text-[#00B14F]">Metrics</span></h1>
        </div>
        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-3">Menu Utama</div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all duration-200
              ${isActive ? 'bg-[#E5F7ED] text-[#00B14F] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
            `}
          >
            {item.icon}
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 shrink-0">
        <NavLink to="/" onClick={onClose} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl font-bold text-sm text-slate-600 transition-all border border-slate-200">
          <ArrowLeft size={18} />
          Kembali ke Portal
        </NavLink>
      </div>
    </div>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const isHomepage = location.pathname === '/'; 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  return (
    <div className="flex h-screen bg-[#F7F9FA] selection:bg-[#00B14F]/20 selection:text-[#00B14F] overflow-hidden relative">
      
      {/* ⚡ SUNTIKAN FONT INTER GLOBAL */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif !important; }
      `}</style>

      {!isHomepage && (
        <aside className="w-[260px] border-r border-slate-200 h-full shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-20 hidden md:block shrink-0">
          <SidebarContent onClose={() => {}} />
        </aside>
      )}

      {!isHomepage && (
        <>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          )}
          <aside className={`fixed inset-y-0 left-0 w-[280px] bg-white z-50 md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isHomepage && (
          <header className="h-[72px] bg-white border-b border-slate-100 flex items-center justify-between px-4 md:hidden shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00B14F] rounded-lg flex items-center justify-center shadow-sm">
                <Store size={16} className="text-white" />
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Grab<span className="text-[#00B14F]">Metrics</span></h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
              <Menu size={24} />
            </button>
          </header>
        )}

        <main className={`flex-1 overflow-y-auto w-full ${isHomepage ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
          <div className={`mx-auto ${isHomepage ? 'w-full h-full' : 'max-w-7xl'}`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/gms" element={<GMSTracker />} />
              <Route path="/merchant" element={<MerchantList />} />
              <Route path="/merchant/:id" element={<MerchantDetail />} />
              <Route path="/okr" element={<OKRTracker />} />
              <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="/ads" element={<AdsTracker />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [activePeriod, setActivePeriod] = useState('current');
  const [selectedAm, setSelectedAm] = useState('All'); 

  const handlePeriodChange = useCallback((period) => setActivePeriod(period), []);

  const timeMachineValue = useMemo(() => ({ activePeriod, handlePeriodChange }), [activePeriod, handlePeriodChange]);
  const globalFilterValue = useMemo(() => ({ selectedAm, setSelectedAm }), [selectedAm, setSelectedAm]);

  return (
    <TimeMachineContext.Provider value={timeMachineValue}>
      <GlobalFilterContext.Provider value={globalFilterValue}>
        <Router>
          <AppLayout />
        </Router>
      </GlobalFilterContext.Provider>
    </TimeMachineContext.Provider>
  );
}