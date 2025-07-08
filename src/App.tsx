import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from './context/CurrencyContext';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import InvoiceCreator from './components/Invoice/InvoiceCreator';
import BusinessProfile from './components/Profile/BusinessProfile';
import Settings from './components/Settings/Settings';
import { LandingPage } from './components/LandingPage';

function App() {
  return (
    <CurrencyProvider>
      <HelmetProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/create" element={<Layout><InvoiceCreator /></Layout>} />
            <Route path="/edit/:id" element={<Layout><InvoiceCreator /></Layout>} />
            <Route path="/profile" element={<Layout><BusinessProfile /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
          </Routes>
        </Router>
      </HelmetProvider>
    </CurrencyProvider>
  );
}

export default App;