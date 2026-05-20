import React, { useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import { ShoppingCart, Megaphone, TrendingUp } from 'lucide-react';

// --- DASHBOARD COMPONENT (DENGAN TAILWIND TEST) ---
const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau KPI utama untuk periode ini.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Basketsize */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Basketsize</p>
            <h3 className="text-2xl font-bold text-slate-800">Rp 125.000</h3>
          </div>
        </div>

        {/* Card 2: Ads Spender */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <Megaphone size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ads Spent</p>
            <h3 className="text-2xl font-bold text-slate-800">Rp 4.5M</h3>
          </div>
        </div>

        {/* Card 3: MCA */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">MCA</p>
            <h3 className="text-2xl font-bold text-slate-800">18.4%</h3>
          </div>
        </div>
      </div>
      
      {/* Placeholder untuk Charts */}
      <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl h-64 flex items-center justify-center text-slate-400 font-medium">
        [ Area Chart Top 10 Akan Muncul Di Sini ]
      </div>
    </div>
  );
};

// --- PLACEHOLDER UNTUK MENU LAIN ---
const GMSTracker = () => <div className="p-6 text-slate-800">GMS Tracker View</div>;
const MerchantDetail = () => <div className="p-6 text-slate-800">Merchant Detail View</div>;
const OKRTracker = () => <div className="p-6 text-slate-800">OKR Tracker View</div>;

// --- GLOBAL CONTEXT ---
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