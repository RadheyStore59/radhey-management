import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, AlertCircle, Eye } from 'lucide-react';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import { showToast } from '../utils/toast';
import { stockAPI, formConfigAPI } from '../utils/api';
import ConfirmDialog from './ConfirmDialog';
import TableSkeleton from './SkeletonLoader';
import SelectField from './SelectField';
import { DynamicFormField } from '../types/formConfig';

// Types
interface StockItem {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  category_id: string;
  brand_id: string;
  dealer_id: string;
  date_received: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function StockManagement() {
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin';
  
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<StockItem | null>(null);
  const [dynamicFields, setDynamicFields] = useState<DynamicFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantity: 1,
    unit: '',
    purchase_price: 0,
    category_id: '',
    brand_id: '',
    dealer_id: '',
    date_received: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: ''
  });

  // Fetch data
  useEffect(() => {
    fetchStockItems();
    fetchDynamicFields();
  }, []);

  const fetchDynamicFields = async () => {
    try {
      const data = await formConfigAPI.getByModule('stock');
      setDynamicFields((data?.fields || []).filter((f: DynamicFormField) => f.enabled !== false));
    } catch (error) {
      console.error('Error fetching stock form config:', error);
      setDynamicFields([]);
    }
  };

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (selectedDealer) params.dealer = selectedDealer;
      
      const items = await stockAPI.getAll(params);
      setStockItems(items);
    } catch (error) {
      showToast('Failed to fetch stock items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    fetchStockItems();
  }, [searchTerm, selectedCategory, selectedBrand, selectedDealer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        await stockAPI.update(editingItem._id, formData);
        showToast('Stock item updated successfully', 'success');
      } else {
        await stockAPI.create(formData);
        showToast('Stock item created successfully', 'success');
      }

      setShowForm(false);
      setEditingItem(null);
      resetForm();
      fetchStockItems();
    } catch (error) {
      showToast('Error saving stock item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit,
      purchase_price: item.purchase_price,
      category_id: item.category_id,
      brand_id: item.brand_id,
      dealer_id: item.dealer_id,
      date_received: item.date_received.split('T')[0],
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;
    
    try {
      await stockAPI.delete(deleteItemId);
      showToast('Stock item deleted successfully', 'success');
      setDeleteItemId(null);
      fetchStockItems();
    } catch (error) {
      showToast('Failed to delete stock item', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      quantity: 1,
      unit: '',
      purchase_price: 0,
      category_id: '',
      brand_id: '',
      dealer_id: '',
      date_received: new Date().toISOString().split('T')[0],
      expiry_date: '',
      notes: ''
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
  };

  const getLowStockClass = (quantity: number) => {
    if (quantity <= 5) return 'text-red-600 font-bold';
    if (quantity <= 10) return 'text-amber-600 font-semibold';
    return 'text-slate-700';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-tight sm:leading-normal">Stock Management</h1>
            <p className="text-slate-500 font-medium text-base sm:text-lg">Manage your inventory and stock items</p>
          </div>
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: '',
                  sku: '',
                  description: '',
                  quantity: 1,
                  unit: '',
                  purchase_price: 0,
                  category_id: '',
                  brand_id: '',
                  dealer_id: '',
                  date_received: new Date().toISOString().split('T')[0],
                  expiry_date: '',
                  notes: ''
                });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-sm font-bold ml-2 active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              <span className="hidden sm:inline">Add Stock Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
            />
          </div>
          
          <SelectField
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value)}
            options={[{ value: '', label: 'All Categories' }, ...(dynamicFields.find(f => f.key === 'category_id')?.options || []).map((opt) => ({ value: opt, label: opt }))]}
            placeholder="All Categories"
          />
          
          <SelectField
            value={selectedBrand}
            onChange={(value) => setSelectedBrand(value)}
            options={[{ value: '', label: 'All Brands' }, ...(dynamicFields.find(f => f.key === 'brand_id')?.options || []).map((opt) => ({ value: opt, label: opt }))]}
            placeholder="All Brands"
          />
          
          <SelectField
            value={selectedDealer}
            onChange={(value) => setSelectedDealer(value)}
            options={[{ value: '', label: 'All Dealers' }, ...(dynamicFields.find(f => f.key === 'dealer_id')?.options || []).map((opt) => ({ value: opt, label: opt }))]}
            placeholder="All Dealers"
          />
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
        {loading ? (
          <TableSkeleton />
        ) : stockItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No stock items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Item Name</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">SKU</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Brand</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Dealer</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Quantity</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Unit</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Price</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 sm:px-5 py-4">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 mt-1">{item.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-5 py-4 font-mono text-xs text-slate-600">{item.sku}</td>
                    <td className="px-3 sm:px-5 py-4 text-sm text-slate-700">{item.category_id}</td>
                    <td className="px-3 sm:px-5 py-4 text-sm text-slate-700">{item.brand_id}</td>
                    <td className="px-3 sm:px-5 py-4 text-sm text-slate-700">{item.dealer_id}</td>
                    <td className="px-3 sm:px-5 py-4">
                      <span className={getLowStockClass(item.quantity)}>
                        {item.quantity}
                        {item.quantity <= 5 && (
                          <AlertCircle size={14} className="inline ml-1" />
                        )}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-4 text-sm text-slate-700">{item.unit}</td>
                    <td className="px-3 sm:px-5 py-4 text-sm text-slate-700">₹{item.purchase_price.toFixed(2)}</td>
                    <td className="px-3 sm:px-5 py-4 text-sm text-slate-700">{formatDate(item.date_received)}</td>
                    <td className="px-3 sm:px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setViewingItem(item); setShowViewModal(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteItemId(item._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
            <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {editingItem ? 'Edit Stock Item' : 'New Stock Item'}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Fill in the details for the stock item</p>
              </div>
              <button 
                onClick={() => setShowForm(false)} 
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 sm:space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Item Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter item name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Enter SKU"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">
                      Category {dynamicFields.find(f => f.key === 'category_id')?.required && '*'}
                    </label>
                    <SelectField
                      value={formData.category_id}
                      onChange={(value) => setFormData({ ...formData, category_id: value })}
                      options={(dynamicFields.find(f => f.key === 'category_id')?.options || []).map((opt) => ({ value: opt, label: opt }))}
                      placeholder="Select Category"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">
                      Brand {dynamicFields.find(f => f.key === 'brand_id')?.required && '*'}
                    </label>
                    <SelectField
                      value={formData.brand_id}
                      onChange={(value) => setFormData({ ...formData, brand_id: value })}
                      options={(dynamicFields.find(f => f.key === 'brand_id')?.options || []).map((opt) => ({ value: opt, label: opt }))}
                      placeholder="Select Brand"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">
                      Dealer {dynamicFields.find(f => f.key === 'dealer_id')?.required && '*'}
                    </label>
                    <SelectField
                      value={formData.dealer_id}
                      onChange={(value) => setFormData({ ...formData, dealer_id: value })}
                      options={(dynamicFields.find(f => f.key === 'dealer_id')?.options || []).map((opt) => ({ value: opt, label: opt }))}
                      placeholder="Select Dealer"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity & Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Quantity & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      placeholder="Enter quantity"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Unit *</label>
                    <input
                      type="text"
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., pcs, kg, liters"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Purchase Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter purchase price"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Date Received *</label>
                    <input
                      type="date"
                      required
                      value={formData.date_received}
                      onChange={(e) => setFormData({ ...formData, date_received: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Additional Information</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter any additional notes"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                  />
                </div>
              </div>

                            
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-100">
            {/* Header with solid color */}
            <div className="bg-blue-600 px-8 py-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Stock Item Details</h2>
                  <p className="text-blue-100 text-sm font-medium mt-1">SKU: {viewingItem.sku}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors text-blue-100 hover:text-white"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
              {/* Key Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{viewingItem.quantity}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Price</p>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{viewingItem.purchase_price.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">₹{(viewingItem.quantity * viewingItem.purchase_price).toFixed(2)}</p>
                </div>
              </div>

              {/* Product Highlight Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 mb-6 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Item</p>
                    <p className="text-lg font-black text-slate-900">{viewingItem.name}</p>
                    {viewingItem.description && (
                      <p className="text-sm text-slate-600 mt-1">{viewingItem.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Unit</p>
                    <p className="text-lg font-black text-slate-900">{viewingItem.unit}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Category Info */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Classification
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Category</span>
                      <span className="text-xs font-bold text-slate-900">{viewingItem.category_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Brand</span>
                      <span className="text-xs font-bold text-slate-900">{viewingItem.brand_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Dealer</span>
                      <span className="text-xs font-bold text-slate-900">{viewingItem.dealer_id}</span>
                    </div>
                  </div>
                </div>

                {/* Date Info */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    Dates
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Date Received</span>
                      <span className="text-xs font-bold text-slate-900">{formatDate(viewingItem.date_received)}</span>
                    </div>
                    {viewingItem.expiry_date && (
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500">Expiry Date</span>
                        <span className="text-xs font-bold text-slate-900">{formatDate(viewingItem.expiry_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingItem.notes && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Notes
                  </h4>
                  <p className="text-sm text-slate-700">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteItemId}
        onCancel={() => setDeleteItemId(null)}
        onConfirm={handleDelete}
        title="Delete Stock Item"
        message="Are you sure you want to delete this stock item? This action cannot be undone."
      />
    </div>
  );
}
