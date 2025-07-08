import React, { createContext, useContext, useEffect, useState } from 'react';
import { storageUtils } from '../utils/storage';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState('USD');

  useEffect(() => {
    const settings = storageUtils.getSettings();
    setCurrencyState(settings.currency || 'USD');
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    const settings = storageUtils.getSettings();
    storageUtils.saveSettings({ ...settings, currency: newCurrency });
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
