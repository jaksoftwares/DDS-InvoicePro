import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Settings, BarChart3, Plus, Menu, X, Building2 } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'New Invoice', href: '/create', icon: Plus },
    { name: 'BusinessInfo', href: '/business-profile', icon: Building2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-gradient-to-br from-blue-100 via-indigo-50 to-white shadow-lg border-b border-blue-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors border-2 border-blue-400 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">Dovepeak Digital Solutions InvoicePro</span>
                <span className="block text-xs text-blue-700 font-semibold">Professional Invoicing</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-200 text-blue-800 shadow-sm font-bold'
                      : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-blue-200 bg-gradient-to-br from-blue-100 via-indigo-50 to-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-200 text-blue-800 shadow-sm font-bold'
                      : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;