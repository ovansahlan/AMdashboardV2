import React, { useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import GMSTracker from './pages/GMSTracker';

// ⚡ IMPORT BARU KITA TARUH DI SINI (Harus sejajar di atas)
import MerchantList from './pages/MerchantList'; 

// Placeholder minimalis untuk menu lainnya (MerchantDetail sudah dihapus)
const OKRTracker = () => <div className="p-6 text-slate-800 font-medium">OKR Tracker View</div>;

export const TimeMachineContext = React.createContext();

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
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#00B14F]/20 selection:text-[#00B14F]">
          <Header />
          <main className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/gms" element={<GMSTracker />} />
              
              {/* ⚡ ROUTE BARU MENUJU MERCHANT LIST */}
              <Route path="/merchant" element={<MerchantList />} /> 
              
              <Route path="/okr" element={<OKRTracker />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TimeMachineContext.Provider>
  );
}