import React, { useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Home from './pages/Home'; // 👈 IMPORT HALAMAN BARU
import Dashboard from './pages/Dashboard';
import GMSTracker from './pages/GMSTracker';

// Placeholder minimalis untuk menu lainnya
const MerchantDetail = () => <div className="p-6 text-slate-800 font-medium">Merchant Detail View</div>;
const OKRTracker = () => <div className="p-6 text-slate-800 font-medium">OKR Tracker View</div>;

export const TimeMachineContext = React.createContext();

// 🛠️ BUNGKUSAN LAYOUT BARU: Mengontrol kapan Header muncul
const AppLayout = () => {
  const location = useLocation();
  const isHomepage = location.pathname === '/'; // Deteksi apakah sedang di Homepage

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#00B14F]/20 selection:text-[#00B14F]">
      {/* Header HANYA muncul jika bukan di Homepage */}
      {!isHomepage && <Header />}
      
      {/* Jika di Homepage, gunakan lebar penuh. Jika di halaman lain, gunakan max-w-7xl */}
      <main className={isHomepage ? "w-full" : "max-w-7xl mx-auto w-full"}>
        <Routes>
          {/* 👈 ROUTE HOMEPAGE */}
          <Route path="/" element={<Home />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gms" element={<GMSTracker />} />
          <Route path="/merchant/:id?" element={<MerchantDetail />} />
          <Route path="/okr" element={<OKRTracker />} />
          
          {/* 👈 UBAH FALLBACK: Jika URL ngaco, kembalikan ke Homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  const [activePeriod, setActivePeriod] = useState('current');

  const handlePeriodChange = useCallback((period) => {
    setActivePeriod(period);
  }, []);

  const timeMachineValue = useMemo(() => ({
    activePeriod,
    handlePeriodChange
  }), [activePeriod, handlePeriodChange]);

  return (
    <TimeMachineContext.Provider value={timeMachineValue}>
      <Router>
        {/* Router dipisah ke AppLayout agar bisa menggunakan hook useLocation */}
        <AppLayout />
      </Router>
    </TimeMachineContext.Provider>
  );
}
// fix: Vercel import case sensitivity