import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Users,
  IndianRupee,
  Target,
  Activity
} from 'lucide-react';
import { DashboardStats } from '../types';
import { dashboardAPI } from '../utils/api';
import SkeletonLoader, { StatsCardSkeleton, TableSkeleton } from './SkeletonLoader';
import { useAuth } from '../contexts/LocalStorageAuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('Dashboard - User data:', user);
  console.log('Dashboard - User name:', user?.name);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardAPI.getStats();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Total Revenue</span>
            <div className="flex items-center gap-2 relative z-10">
              <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 break-words">{(stats?.totalRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10">Net Profit</span>
            <div className="flex items-center gap-2 relative z-10">
              <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 break-words">{(stats?.totalProfit || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid - 4 cards in top row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(stats?.totalProfit || 0)}
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-orange-500 to-red-500"
        />
        <StatCard
          title="Total Investments"
          value={formatCurrency(stats?.totalInvestmentAmount || 0)}
          icon={Target}
          gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
        />
        </div>

        {/* Secondary Stats Grid - 3 cards in second row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Quantity"
            value={stats?.totalQuantity || 0}
            icon={ShoppingCart}
            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
          />
          <StatCard
            title="Total Profit - Investment Amount"
            value={formatCurrency((stats?.totalProfit || 0) - (stats?.totalInvestmentAmount || 0))}
            icon={IndianRupee}
            gradient="bg-gradient-to-br from-indigo-500 to-violet-500"
          />
          <StatCard
            title="Active Leads"
            value={stats?.activeLeads || 0}
            icon={Activity}
            gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
          />
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
