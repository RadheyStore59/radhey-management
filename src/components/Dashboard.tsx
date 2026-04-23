import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Users,
  IndianRupee,
  Target,
  Activity,
  Package,
  Calendar,
  X,
  Clock
} from 'lucide-react';
import { DashboardStats } from '../types';
import { dashboardAPI } from '../utils/api';
import SkeletonLoader, { StatsCardSkeleton } from './SkeletonLoader';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import DatePickerField from './DatePickerField';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('Dashboard - User data:', user);
  console.log('Dashboard - User name:', user?.name);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchDashboardData = useCallback(async () => {
    try {
      const params: any = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      console.log('Dashboard - Fetching with params:', params);
      const data = await dashboardAPI.getStats(params);
      console.log('Dashboard - Received data:', data);
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
        <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <SkeletonLoader height="h-10 sm:h-12" width="w-40 sm:w-48" className="mb-3" />
            <SkeletonLoader height="h-5 sm:h-6" width="w-56 sm:w-64" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
              <SkeletonLoader height="h-3 sm:h-4" width="w-20 sm:w-24" className="mb-2" />
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded animate-pulse" />
                <SkeletonLoader height="h-7 sm:h-8" width="w-16 sm:w-20" />
              </div>
            </div>
            <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
              <SkeletonLoader height="h-3 sm:h-4" width="w-20 sm:w-24" className="mb-2" />
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded animate-pulse" />
                <SkeletonLoader height="h-7 sm:h-8" width="w-16 sm:w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid - 4 cards in top row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Secondary Stats Grid - 3 cards in second row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 border border-slate-100">
          <SkeletonLoader height="h-5 sm:h-6" width="w-28 sm:w-32" className="mb-4 sm:mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl">
              <SkeletonLoader variant="avatar" />
              <SkeletonLoader height="h-4" width="w-20 sm:w-24" />
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl">
              <SkeletonLoader variant="avatar" />
              <SkeletonLoader height="h-4" width="w-16 sm:w-20" />
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl">
              <SkeletonLoader variant="avatar" />
              <SkeletonLoader height="h-4" width="w-24 sm:w-28" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, gradient }: any) => {
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 border border-slate-100 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-medium text-slate-600">{title}</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2">{value}</p>
          </div>
          <div className={`p-2.5 sm:p-3 rounded-xl ${gradient} flex-shrink-0`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-tight sm:leading-normal">Hi, {user?.name || 'User'}</h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">Welcome to your business management dashboard</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="relative group w-[120px] sm:w-[160px]">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={16} />
              <DatePickerField
                value={dateRange.startDate}
                onChange={(value) => setDateRange(prev => ({ ...prev, startDate: value }))}
                placeholder="From"
                className="pl-10 pr-2 py-2 sm:py-3 text-xs sm:text-sm"
              />
            </div>
            <div className="relative group w-[120px] sm:w-[160px]">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={16} />
              <DatePickerField
                value={dateRange.endDate}
                onChange={(value) => setDateRange(prev => ({ ...prev, endDate: value }))}
                placeholder="To"
                className="pl-10 pr-2 py-2 sm:py-3 text-xs sm:text-sm"
              />
            </div>
            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear Date Filter"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="hidden sm:flex bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-col items-end relative overflow-hidden group min-w-[140px]">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 whitespace-nowrap">Total Revenue</span>
            <div className="flex items-center gap-1 relative z-10">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              <span className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 whitespace-nowrap">{(stats?.totalRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="hidden sm:flex bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-col items-end relative overflow-hidden group min-w-[140px]">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10 whitespace-nowrap">Gross Profit</span>
            <div className="flex items-center gap-1 relative z-10">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              <span className="text-lg sm:text-xl lg:text-2xl font-black text-emerald-600 whitespace-nowrap">{(stats?.totalProfit || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Dashboard - Bento Style Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min mb-8">
        {/* Hero Card - Total Revenue */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full -mr-16 -mt-16 sm:-mr-20 sm:-mt-20"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -ml-12 -mb-12 sm:-ml-16 sm:-mb-16"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl">
                <IndianRupee className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className="text-blue-100 font-medium text-sm sm:text-base">Total Revenue</span>
            </div>
            <p className="text-3xl sm:text-5xl font-black mb-2">{formatCurrency(stats?.totalRevenue || 0)}</p>
            <p className="text-blue-200 text-xs sm:text-sm">All time business revenue</p>
            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 backdrop-blur-sm">
                <p className="text-xs text-blue-200 mb-1">Gross Profit</p>
                <p className="text-base sm:text-lg font-bold">{formatCurrency(stats?.totalProfit || 0)}</p>
              </div>
              <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 backdrop-blur-sm">
                <p className="text-xs text-blue-200 mb-1">Net Profit</p>
                <p className="text-base sm:text-lg font-bold">{formatCurrency((stats?.totalProfit || 0) - (stats?.totalInvestmentAmount || 0))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tall Card - Pending Payments */}
        <div className="col-span-1 lg:row-span-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full -mr-10 -mt-10 sm:-mr-12 sm:-mt-12"></div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl w-fit mb-3 sm:mb-4">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-amber-100 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Pending</p>
            <p className="text-2xl sm:text-3xl font-black mb-1">{formatCurrency(stats?.pendingPaymentAmount || 0)}</p>
            <p className="text-amber-100 text-xs">To collect</p>
            <div className="mt-auto">
              <div className="bg-white/10 rounded-lg p-2.5 sm:p-3 backdrop-blur-sm mt-3 sm:mt-4">
                <p className="text-xs text-amber-100">Active Leads</p>
                <p className="text-xl sm:text-2xl font-bold">{stats?.activeLeads || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Normal Cards */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-1">Gross Profit</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalProfit || 0)}</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-1">Investments</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalInvestmentAmount || 0)}</p>
        </div>

        {/* Row 2 Cards */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-1">Total Leads</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats?.totalLeads || 0}</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-1">Stock Qty</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{(stats?.totalStockQuantity || 0).toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-1">Stock Value</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalStockValue || 0)}</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-1">Qty Sold</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats?.totalQuantity || 0}</p>
        </div>
      </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 border border-slate-100">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-4 sm:mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <button onClick={() => navigate('/leads')} className="flex items-center justify-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all active:scale-95">
              <Users className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base">Add New Lead</span>
            </button>
            <button onClick={() => navigate('/sales')} className="flex items-center justify-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-green-100 text-green-600 rounded-xl hover:from-green-100 hover:to-green-200 transition-all active:scale-95">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base">Create Sale</span>
            </button>
            <button onClick={() => navigate('/investments')} className="flex items-center justify-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all active:scale-95">
              <Target className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base">Add Investment</span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
