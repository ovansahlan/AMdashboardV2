import React, { useState, useMemo, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// Layout & Components
import Header from './components/layout/Header';

// Placeholder untuk Pages (Nanti di-import dari folder /features)
const Dashboard = () => (
  <div className="p-6 text-slate-800">Main Dashboard View</div>
);
const GMSTracker = () => (
  <div className="p-6 text-slate-800">GMS Tracker View</div>
);
const MerchantDetail = () => (
  <div className="p-6 text-slate-800">Merchant Detail View</div>
);
const OKRTracker = () => (
  <div className="p-6 text-slate-800">OKR Tracker View</div>
);

// Global Context untuk Time Machine (Archive DB)
export const TimeMachineContext = React.createContext();

export default function App() {
  // State untuk Time Machine (Default: 'current' atau bulan berjalan)
  const [activePeriod, setActivePeriod] = useState('current');

  // Gunakan useCallback agar fungsi tidak di-recreate setiap render
  const handlePeriodChange = useCallback((period) => {
    setActivePeriod(period);
    // Di sini nanti bisa ditambahkan logika untuk trigger re-fetch/clear cache data GAS
    console.log(`[Time Machine] DB Period switched to: ${period}`);
  }, []);

  // Gunakan useMemo untuk value context demi mencegah re-render pada child component
  const timeMachineValue = useMemo(
    () => ({
      activePeriod,
      handlePeriodChange,
    }),
    [activePeriod, handlePeriodChange]
  );

  return (
    <TimeMachineContext.Provider value={timeMachineValue}>
      <Router>
        {/* Layout Wrapper - Strictly Light Mode Background */}
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100 selection:text-green-900">
          <Header />

          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/gms" element={<GMSTracker />} />
              <Route path="/merchant/:id?" element={<MerchantDetail />} />
              <Route path="/okr" element={<OKRTracker />} />

              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TimeMachineContext.Provider>
  );
}
