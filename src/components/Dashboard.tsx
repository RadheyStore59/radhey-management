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

export default function Dashboard() {
  const navigate = useNavigate();
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

  const StatCard = ({ title, value, icon: Icon, color }: any) => {
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-slate-100 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-8 bg-gray-50/30 min-h-screen font-sans">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">Dashboard</h1>
          <p className="text-slate-500 font-medium text-lg">Welcome to your business management dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Total Revenue</span>
            <div className="flex items-center gap-2 relative z-10">
              <IndianRupee className="w-6 h-6 text-slate-700" />
              <span className="text-3xl font-black text-slate-900">{(stats?.totalRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10">Net Profit</span>
            <div className="flex items-center gap-2 relative z-10">
              <IndianRupee className="w-6 h-6 text-emerald-500" />
              <span className="text-3xl font-black text-emerald-600">{(stats?.totalProfit || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Quantity"
          value={stats?.totalQuantity || 0}
          icon={ShoppingCart}
          color="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={IndianRupee}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(stats?.totalProfit || 0)}
          icon={IndianRupee}
          color="bg-orange-500"
        />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Total Profit - Investment Amount"
            value={formatCurrency((stats?.totalProfit || 0) - (stats?.totalInvestmentAmount || 0))}
            icon={IndianRupee}
            color="bg-indigo-500"
          />
          <StatCard
            title="Active Leads"
            value={stats?.activeLeads || 0}
            icon={Activity}
            color="bg-teal-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => navigate('/leads')} className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
              <Users className="w-5 h-5" />
              <span className="font-medium">Add New Lead</span>
            </button>
            <button onClick={() => navigate('/sales')} className="flex items-center justify-center gap-3 p-4 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Create Sale</span>
            </button>
            <button onClick={() => navigate('/investments')} className="flex items-center justify-center gap-3 p-4 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors">
              <Target className="w-5 h-5" />
              <span className="font-medium">Add Investment</span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
