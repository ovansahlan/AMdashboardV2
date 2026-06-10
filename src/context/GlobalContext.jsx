import React, { createContext, useState, useMemo, useCallback } from 'react';

export const TimeMachineContext = createContext();
export const GlobalFilterContext = createContext();

export function GlobalProvider({ children }) {
  const [activePeriod, setActivePeriod] = useState('current');
  const [selectedAm, setSelectedAm] = useState('All');

  const handlePeriodChange = useCallback((period) => setActivePeriod(period), []);

  const timeMachineValue = useMemo(() => ({ activePeriod, handlePeriodChange }), [activePeriod, handlePeriodChange]);
  const globalFilterValue = useMemo(() => ({ selectedAm, setSelectedAm }), [selectedAm, setSelectedAm]);

  return (
    <TimeMachineContext.Provider value={timeMachineValue}>
      <GlobalFilterContext.Provider value={globalFilterValue}>
        {children}
      </GlobalFilterContext.Provider>
    </TimeMachineContext.Provider>
  );
}