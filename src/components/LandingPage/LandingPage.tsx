import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Send } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-indigo-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <img src="/logo.jpg" alt="Dovepeak Digital Solutions Logo" className="h-10 w-10 rounded-full shadow-lg border-2 border-blue-400" />
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Dovepeak Digital Solutions</span>
        </div>
        <nav className="hidden sm:flex space-x-6">
          <a href="#features" className="text-blue-700 font-semibold hover:underline underline-offset-4 transition-colors">Features</a>
          <a href="#about" className="text-blue-700 font-semibold hover:underline underline-offset-4 transition-colors">About</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-8 pb-4">
        <div className="max-w-3xl w-full">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight drop-shadow-xl">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 bg-clip-text text-transparent">Modern Invoicing</span> for Digital Businesses
          </h1>
          <p className="text-base sm:text-lg md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Create, preview, and send professional invoices in seconds. Our sleek, intuitive platform helps you get paid faster and look great doing it—on any device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/create"
              className="inline-flex items-center px-8 py-4 bg-blue-700 text-white text-lg sm:text-xl font-bold rounded-full shadow-xl hover:bg-blue-800 transition-colors group focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Get Started Free
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white text-lg sm:text-xl font-bold rounded-full shadow-xl hover:bg-indigo-700 transition-colors group focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              Go to Dashboard
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        <div className="mt-12 w-full flex justify-center">
          <img src="/sample-template.png" alt="Invoice Generator Preview" className="rounded-2xl shadow-2xl w-full max-w-xl border border-blue-100" />
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <Sparkles className="text-blue-600 h-10 w-10 mb-4" />
            <h3 className="font-bold text-lg mb-2">Effortless Creation</h3>
            <p className="text-gray-600 text-center">Generate invoices with a beautiful, guided form. No design skills required—just fill and send.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <Send className="text-green-600 h-10 w-10 mb-4" />
            <h3 className="font-bold text-lg mb-2">Instant Email & PDF</h3>
            <p className="text-gray-600 text-center">Send invoices directly to clients or download as PDF with a single click. Fast, reliable, and secure.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <ShieldCheck className="text-indigo-600 h-10 w-10 mb-4" />
            <h3 className="font-bold text-lg mb-2">Private & Secure</h3>
            <p className="text-gray-600 text-center">Your data stays private and protected. No unnecessary signups, no tracking, just peace of mind.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">About Dovepeak Digital Solutions</h2>
          <p className="text-gray-700 mb-2 text-base sm:text-lg">
            We empower businesses to thrive in the digital era. Our invoice generator is crafted for speed, accuracy, and a professional look—helping you save time, reduce errors, and get paid faster.
          </p>
          <p className="text-gray-600 text-sm">Contact: <a href="mailto:contact@dovepeakdigital.com" className="underline hover:text-blue-700">contact@dovepeakdigital.com</a></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm bg-white/80 border-t border-blue-100 mt-8">
        &copy; {new Date().getFullYear()} Dovepeak Digital Solutions. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
