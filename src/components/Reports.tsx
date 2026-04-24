import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { supabase } from '../utils/supabase';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const [salesRes, inventoryRes, leadsRes] = await Promise.all([
        supabase
          .from('sales')
          .select('*')
          .gte('sales_date', dateRange.start)
          .lte('sales_date', dateRange.end)
          .order('sales_date', { ascending: false }),
        
        supabase
          .from('inventory')
          .select('*')
          .order('stock_quantity', { ascending: true }),
        
        supabase
          .from('leads')
          .select('*')
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: false }),
      ]);

      setSalesData(salesRes.data || []);
      setInventoryData(inventoryRes.data || []);
      setLeadsData(leadsRes.data || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalSales = salesData.length;
    const totalLeads = leadsData.length;
    const lowStockItems = inventoryData.filter(item => item.stock_quantity <= item.minimum_stock_level).length;
    const convertedLeads = leadsData.filter(lead => lead.status === 'Won').length;

    return {
      totalRevenue,
      totalSales,
      totalLeads,
      lowStockItems,
      conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0',
    };
  };

  const exportDailySalesReport = () => {
    const dailyData = salesData.reduce((acc: any, sale) => {
      const date = sale.sales_date;
      if (!acc[date]) {
        acc[date] = { date, totalRevenue: 0, totalSales: 0, sales: [] };
      }
      acc[date].totalRevenue += sale.total_amount;
      acc[date].totalSales += 1;
      acc[date].sales.push(sale);
      return acc;
    }, {});

    const ws = XLSX.utils.json_to_sheet(Object.values(dailyData).map((day: any) => ({
      'Date': day.date,
      'Total Sales': day.totalSales,
      'Total Revenue': day.totalRevenue,
      'Average Sale Value': day.totalSales > 0 ? (day.totalRevenue / day.totalSales).toFixed(2) : 0,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales Report');
    XLSX.writeFile(wb, `daily_sales_report_${dateRange.start}_to_${dateRange.end}.xlsx`);
  };

  const exportMonthlySalesReport = () => {
    const monthlyData = salesData.reduce((acc: any, sale) => {
      const month = sale.sales_date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, totalRevenue: 0, totalSales: 0, sales: [] };
      }
      acc[month].totalRevenue += sale.total_amount;
      acc[month].totalSales += 1;
      acc[month].sales.push(sale);
      return acc;
    }, {});

    const ws = XLSX.utils.json_to_sheet(Object.values(monthlyData).map((month: any) => ({
      'Month': month.month,
      'Total Sales': month.totalSales,
      'Total Revenue': month.totalRevenue,
      'Average Sale Value': month.totalSales > 0 ? (month.totalRevenue / month.totalSales).toFixed(2) : 0,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Sales Report');
    XLSX.writeFile(wb, `monthly_sales_report_${dateRange.start}_to_${dateRange.end}.xlsx`);
  };

  const exportInventoryReport = () => {
    const ws = XLSX.utils.json_to_sheet(inventoryData.map(item => ({
      'Product Name': item.product_name,
      'Product Code': item.product_code,
      'Category': item.category,
      'Current Stock': item.stock_quantity,
      'Minimum Stock Level': item.minimum_stock_level,
      'Stock Status': item.stock_quantity <= item.minimum_stock_level ? 'Low Stock' : 'Adequate',
      'Purchase Price': item.purchase_price,
      'Selling Price': item.selling_price,
      'Profit Margin': ((item.selling_price - item.purchase_price) / item.purchase_price * 100).toFixed(1) + '%',
      'Total Stock Value': item.stock_quantity * item.purchase_price,
      'Supplier': item.supplier_name,
      'Last Updated': item.last_updated_date,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');
    XLSX.writeFile(wb, `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportLowStockReport = () => {
    const lowStockItems = inventoryData.filter(item => item.stock_quantity <= item.minimum_stock_level);
    
    const ws = XLSX.utils.json_to_sheet(lowStockItems.map(item => ({
      'Product Name': item.product_name,
      'Product Code': item.product_code,
      'Category': item.category,
      'Current Stock': item.stock_quantity,
      'Minimum Stock Level': item.minimum_stock_level,
      'Stock Shortage': item.minimum_stock_level - item.stock_quantity,
      'Supplier': item.supplier_name,
      'Last Updated': item.last_updated_date,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Low Stock Report');
    XLSX.writeFile(wb, `low_stock_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Reports</h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">Generate and export business reports</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-xl font-bold text-gray-900">{stats.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <TrendingUp className="text-indigo-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Sales Report</h3>
            <button
              onClick={exportDailySalesReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
          <p className="text-gray-600">
            Daily breakdown of sales performance including revenue and transaction counts.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Sales Report</h3>
            <button
              onClick={exportMonthlySalesReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
          <p className="text-gray-600">
            Monthly sales trends and performance metrics for strategic planning.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Report</h3>
            <button
              onClick={exportInventoryReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
          <p className="text-gray-600">
            Complete inventory status including stock levels, values, and supplier information.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Report</h3>
            <button
              onClick={exportLowStockReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
          <p className="text-gray-600">
            Items that need immediate restocking to avoid stockouts and lost sales.
          </p>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Recent Sales</h4>
            <div className="space-y-2">
              {salesData.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{sale.customer_name}</span>
                  <span className="font-medium">₹{sale.total_amount}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Recent Leads</h4>
            <div className="space-y-2">
              {leadsData.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{lead.lead_name}</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Critical Stock Items</h4>
            <div className="space-y-2">
              {inventoryData
                .filter(item => item.stock_quantity <= item.minimum_stock_level)
                .slice(0, 5)
                .map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product_name}</span>
                    <span className="font-medium text-red-600">{item.stock_quantity} left</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
