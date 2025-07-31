import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import InvoiceCreator from './components/Invoice/InvoiceCreator';
import InvoiceView from './components/Invoice/InvoiceView';
import BusinessProfile from './components/Profile/BusinessProfile';
import Settings from './components/Settings/Settings';
import { LandingPage } from './components/LandingPage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Auth/Profile';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ResetPassword from './components/Auth/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <HelmetProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login/reset-password" element={<ResetPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <Layout><InvoiceCreator /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <ProtectedRoute>
                    <Layout><InvoiceCreator /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoice/:id"
                element={
                  <ProtectedRoute>
                    <Layout><InvoiceView /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout><Profile /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/business-profile"
                element={
                  <ProtectedRoute>
                    <Layout><BusinessProfile /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout><Settings /></Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </HelmetProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
