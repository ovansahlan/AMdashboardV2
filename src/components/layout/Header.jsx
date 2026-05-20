import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Target, History, Store } from 'lucide-react';
import { TimeMachineContext } from '../../App';

const PERIODS = [
  { id: 'current', label: 'Current Month' },
  { id: '2026-04', label: 'April 2026' },
  { id: '2026-03', label: 'March 2026' },
  { id: '2026-02', label: 'February 2026' },
];

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export default function Header() {
  const { activePeriod, handlePeriodChange } = useContext(TimeMachineContext);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm tracking-wider">AM</span>
              </div>
              <span className="font-semibold text-slate-800 text-lg tracking-tight">Dashboard</span>
            </div>

            <nav className="hidden md:flex space-x-1">
              <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
              <NavItem to="/gms" icon={<Users size={18} />} label="GMS Tracker" />
              <NavItem to="/merchant" icon={<Store size={18} />} label="Merchants" />
              <NavItem to="/okr" icon={<Target size={18} />} label="OKR" />
            </nav>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
            <History size={18} className="text-slate-400" />
            <select
              value={activePeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md focus:ring-1 focus:ring-slate-400 focus:border-slate-400 block p-2 cursor-pointer outline-none transition-colors"
            >
              {PERIODS.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label} {period.id === 'current' ? '(Live)' : ''}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>
    </header>
  );
}