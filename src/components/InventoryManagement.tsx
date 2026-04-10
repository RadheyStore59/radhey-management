import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Download, Upload, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Inventory } from '../types';
import { supabase } from '../utils/supabase';
import * as XLSX from 'xlsx';
import ConfirmDialog from './ConfirmDialog';
import { showToast } from '../utils/toast';
import SelectField from './SelectField';

interface InventoryItem {
  id?: string;
  product_name: string;
  product_code: string;
  category: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock_level: number;
  supplier_name: string;
  last_updated_date: string;
}

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    category: '',
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    minimum_stock_level: 5,
    supplier_name: '',
  });

  const [stockFormData, setStockFormData] = useState({
    operation: 'increase' as 'increase' | 'decrease',
    quantity: 0,
    reason: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, categoryFilter]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredInventory(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('inventory')
          .update({
            ...formData,
            last_updated_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        showToast('Inventory item updated successfully.', 'success');
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([{
            ...formData,
            last_updated_date: new Date().toISOString().split('T')[0],
          }]);
        if (error) throw error;
        showToast('Inventory item added successfully.', 'success');
      }

      setShowForm(false);
      setEditingItem(null);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      showToast('Error saving inventory item.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      product_name: item.product_name,
      product_code: item.product_code,
      category: item.category,
      purchase_price: item.purchase_price,
      selling_price: item.selling_price,
      stock_quantity: item.stock_quantity,
      minimum_stock_level: item.minimum_stock_level,
      supplier_name: item.supplier_name,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchInventory();
      showToast('Inventory item deleted successfully.', 'success');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      showToast('Error deleting inventory item.', 'error');
    } finally {
      setDeleteItemId(null);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedItem) return;

    setLoading(true);
    try {
      const newQuantity = stockFormData.operation === 'increase' 
        ? selectedItem.stock_quantity + stockFormData.quantity
        : selectedItem.stock_quantity - stockFormData.quantity;

      if (newQuantity < 0) {
        showToast('Insufficient stock for this operation.', 'error');
        return;
      }

      const { error } = await supabase
        .from('inventory')
        .update({
          stock_quantity: newQuantity,
          last_updated_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      setShowStockModal(false);
      setSelectedItem(null);
      setStockFormData({ operation: 'increase', quantity: 0, reason: '' });
      fetchInventory();
      showToast('Stock updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating stock:', error);
      showToast('Error updating stock.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredInventory.map(item => ({
      'Product Name': item.product_name,
      'Product Code': item.product_code,
      'Category': item.category,
      'Purchase Price': item.purchase_price,
      'Selling Price': item.selling_price,
      'Stock Quantity': item.stock_quantity,
      'Minimum Stock Level': item.minimum_stock_level,
      'Supplier Name': item.supplier_name,
      'Last Updated': item.last_updated_date,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, 'inventory_export.xlsx');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const mappedData = jsonData.map((row: any) => ({
          product_name: row['Product Name'] || row['product_name'] || '',
          product_code: row['Product Code'] || row['product_code'] || '',
          category: row['Category'] || row['category'] || '',
          purchase_price: parseFloat(row['Purchase Price'] || row['purchase_price']) || 0,
          selling_price: parseFloat(row['Selling Price'] || row['selling_price']) || 0,
          stock_quantity: parseInt(row['Stock Quantity'] || row['stock_quantity']) || 0,
          minimum_stock_level: parseInt(row['Minimum Stock Level'] || row['minimum_stock_level']) || 5,
          supplier_name: row['Supplier Name'] || row['supplier_name'] || '',
          last_updated_date: new Date().toISOString().split('T')[0],
        }));

        const { error } = await supabase
          .from('inventory')
          .insert(mappedData);

        if (error) throw error;

        showToast('Inventory imported successfully.', 'success');
        setShowImportModal(false);
        fetchInventory();
      } catch (error) {
        console.error('Error importing file:', error);
        showToast('Error importing file. Please check the format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetForm = () => {
    setFormData({
      product_name: '',
      product_code: '',
      category: '',
      purchase_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      minimum_stock_level: 5,
      supplier_name: '',
    });
  };

  const getCategories = () => {
    return Array.from(new Set(inventory.map(item => item.category)));
  };

  const isLowStock = (item: InventoryItem) => {
    return item.stock_quantity <= item.minimum_stock_level;
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-base sm:text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-tight mb-2">Inventory Management</h1>
        <p className="text-slate-500 font-medium text-base sm:text-lg mt-2">Manage your products and track stock levels</p>
      </div>

      {/* Low Stock Alert */}
      {inventory.filter(isLowStock).length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-3" size={20} />
            <div>
              <h3 className="text-red-800 font-medium">Low Stock Alert</h3>
              <p className="text-red-600 text-sm">
                {inventory.filter(isLowStock).length} items need restocking
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search inventory by name, code, or category..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 focus:bg-white transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="min-w-[180px] sm:min-w-[200px]">
            <SelectField
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'All Categories' },
                ...getCategories().map((category) => ({ value: category, label: category })),
              ]}
              placeholder="All Categories"
            />
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={exportToExcel}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 text-sm"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 flex items-center gap-2 text-sm"
            >
              <Upload size={20} />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                resetForm();
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 text-sm"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                    {isLowStock(item) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                        Low Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.product_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isLowStock(item) ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.stock_quantity}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowStockModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Update Stock"
                      >
                        <TrendingUp size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.minimum_stock_level}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{item.purchase_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{item.selling_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.supplier_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteItemId(item.id || null)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="text-slate-300" size={24} />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {inventory.length === 0
                          ? 'No inventory data yet. Add your first item.'
                          : 'No inventory found matching your criteria'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingItem ? 'Edit Inventory Item' : 'Add New Item'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock Level *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.minimum_stock_level}
                    onChange={(e) => setFormData({ ...formData, minimum_stock_level: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingItem ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Update Stock - {selectedItem.product_name}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <div className="text-lg font-medium text-gray-900">
                  {selectedItem.stock_quantity} units
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation
                </label>
                <SelectField
                  value={stockFormData.operation}
                  onChange={(value) => setStockFormData({ ...stockFormData, operation: value as 'increase' | 'decrease' })}
                  options={[
                    { value: 'increase', label: 'Increase Stock' },
                    { value: 'decrease', label: 'Decrease Stock' },
                  ]}
                  placeholder="Operation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={stockFormData.quantity}
                  onChange={(e) => setStockFormData({ ...stockFormData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={stockFormData.reason}
                  onChange={(e) => setStockFormData({ ...stockFormData, reason: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setSelectedItem(null);
                    setStockFormData({ operation: 'increase', quantity: 0, reason: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStockUpdate}
                  disabled={loading}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Import Inventory from Excel</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileImport}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Expected columns:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Product Name</li>
                  <li>Product Code</li>
                  <li>Category</li>
                  <li>Purchase Price</li>
                  <li>Selling Price</li>
                  <li>Stock Quantity</li>
                  <li>Minimum Stock Level</li>
                  <li>Supplier Name</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteItemId}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this inventory item?"
        confirmText="Delete"
        onCancel={() => setDeleteItemId(null)}
        onConfirm={() => deleteItemId && handleDelete(deleteItemId)}
      />
    </div>
  );
}
