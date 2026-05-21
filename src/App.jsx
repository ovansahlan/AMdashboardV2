import React, { useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import GMSTracker from './pages/GMSTracker';

// Placeholder minimalis untuk menu lainnya
const MerchantDetail = () => <div className="p-6 text-slate-800 font-medium">Merchant Detail View</div>;
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
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100 selection:text-green-900">
          <Header />
          <main className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/gms" element={<GMSTracker />} />
              <Route path="/merchant/:id?" element={<MerchantDetail />} />
              <Route path="/okr" element={<OKRTracker />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TimeMachineContext.Provider>
  );
}
// fix: Vercel import case sensitivity
