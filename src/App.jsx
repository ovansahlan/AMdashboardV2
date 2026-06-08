import React, { useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MerchantList from './pages/MerchantList';
import MerchantDetail from './pages/MerchantDetail';
import GMSTracker from './pages/GMSTracker';

const OKRTracker = () => <div className="p-6 text-slate-800 font-medium">OKR Tracker View</div>;

export const TimeMachineContext = React.createContext();

const AppLayout = () => {
  const location = useLocation();
  const isHomepage = location.pathname === '/'; 

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#00B14F]/20 selection:text-[#00B14F]">
      {!isHomepage && <Header />}
      
      <main className={isHomepage ? "w-full" : "max-w-7xl mx-auto w-full"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gms" element={<GMSTracker />} />
          
          {/* ⚡ ROUTING KE MERCHANT LIST & MERCHANT DETAIL */}
          <Route path="/merchant" element={<MerchantList />} />
          <Route path="/merchant/:id" element={<MerchantDetail />} />
          
          <Route path="/okr" element={<OKRTracker />} />
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
        <AppLayout />
      </Router>
    </TimeMachineContext.Provider>
  );
}