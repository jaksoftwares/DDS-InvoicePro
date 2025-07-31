import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, LogOut, FileText, DollarSign, Users, TrendingUp, Eye, Edit, Trash2, Search, Filter, Calendar } from 'lucide-react';
import { Invoice } from '../../types';
import { storageUtils } from '../../utils/storage';
import { formatCurrency, getStatusColor, getStatusIcon } from '../../utils/invoiceHelpers';
import { format } from 'date-fns';
import SEO from '../SEO';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext'; 

const Dashboard: React.FC = () => {
  const { currency } = useCurrency();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    draftInvoices: 0,
  });
    const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const loadInvoices = () => {
      const savedInvoices = storageUtils.getInvoices();
      setInvoices(savedInvoices);
      
      // Calculate stats
      const totalInvoices = savedInvoices.length;
      const totalRevenue = savedInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);
      const paidInvoices = savedInvoices.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = savedInvoices.filter(inv => inv.status === 'sent').length;
      const overdueInvoices = savedInvoices.filter(inv => inv.status === 'overdue').length;
      const draftInvoices = savedInvoices.filter(inv => inv.status === 'draft').length;
      
      setStats({
        totalInvoices,
        totalRevenue,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        draftInvoices,
      });
    };

    loadInvoices();
  }, []);

  useEffect(() => {
    let filtered = invoices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      storageUtils.deleteInvoice(id);
      const updatedInvoices = invoices.filter(inv => inv.id !== id);
      setInvoices(updatedInvoices);
    }
  };

  interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-2xl font-bold text-gray-900">{value}</dd>
            {subtitle && <dd className="text-xs text-gray-500">{subtitle}</dd>}
          </dl>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <SEO
        title="Dashboard | InvoicePro by Dovepeak Digital Solutions"
        description="View, manage, and track all your business invoices in one place. Analyze revenue, status, and client activity with InvoicePro by Dovepeak Digital Solutions."
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
        keywords="invoice dashboard, manage invoices, business analytics, InvoicePro, Dovepeak Digital Solutions"
        image="/logo192.png"
        type="website"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          'name': 'InvoicePro',
          'url': 'https://yourdomain.com',
          'applicationCategory': 'BusinessApplication',
          'creator': {
            '@type': 'Organization',
            'name': 'Dovepeak Digital Solutions',
            'url': 'https://dovepeak.com',
          },
          'description': 'Business invoice management and analytics dashboard.'
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">
                  {`Welcome back${user?.email ? ", " + user.email : ''}! Here's an overview of your invoice activity`}
                </p>
              </div>
              <div className="mt-6 lg:mt-0 flex items-center gap-4">
                <Link
                  to="/create"
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
            
              title="Total Invoices"
              value={stats.totalInvoices}
              icon={FileText}
              color="bg-blue-500"
              subtitle="All time"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue, currency)}
              icon={DollarSign}
              color="bg-green-500"
              subtitle="Paid invoices"
            />
            <StatCard
              title="Paid"
              value={stats.paidInvoices}
              icon={TrendingUp}
              color="bg-emerald-500"
              subtitle={`${stats.totalInvoices > 0 ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}% completion`}
            />
            <StatCard
              title="Pending"
              value={stats.pendingInvoices}
              icon={Users}
              color="bg-yellow-500"
              subtitle="Awaiting payment"
            />
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Overdue"
              value={stats.overdueInvoices}
              icon={Calendar}
              color="bg-red-500"
              subtitle="Requires attention"
            />
            <StatCard
              title="Drafts"
              value={stats.draftInvoices}
              icon={Edit}
              color="bg-gray-500"
              subtitle="Not yet sent"
            />
          </div>

          {/* Enhanced Invoices Table */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                
                {/* Search and Filter */}
                <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search invoices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your search'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {invoices.length === 0 
                    ? 'Get started by creating your first invoice.' 
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {invoices.length === 0 && (
                  <Link
                    to="/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.slice(0, 10).map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-500 capitalize">{invoice.template} template</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{invoice.clientName}</div>
                          <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Due: {format(new Date(invoice.dueDate), 'MMM dd')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            <span className="mr-1">{getStatusIcon(invoice.status)}</span>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(invoice.createdAt), 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {/* View functionality */}}
                              className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              to={`/edit/${invoice.id}`}
                              className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded"
                              title="Edit Invoice"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;