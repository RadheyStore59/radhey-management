import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import { showToast } from '../utils/toast';
import ConfirmDialog from './ConfirmDialog';
import SkeletonLoader, { TableSkeleton } from './SkeletonLoader';

interface Brand {
  _id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const brandAPI = {
  getAll: async () => {
    const response = await fetch('/api/brands');
    if (!response.ok) throw new Error('Failed to fetch brands');
    return response.json();
  },
  create: async (data: any) => {
    const response = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create brand');
    return response.json();
  },
  update: async (id: string, data: any) => {
    const response = await fetch(`/api/brands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update brand');
    return response.json();
  },
  delete: async (id: string) => {
    const response = await fetch(`/api/brands/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete brand');
    return response.json();
  }
};

export default function BrandManagement() {
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin';
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const br = await brandAPI.getAll();
      setBrands(br);
    } catch (error) {
      showToast('Failed to fetch brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBrand) {
        await brandAPI.update(editingBrand._id, formData);
        showToast('Brand updated successfully', 'success');
      } else {
        await brandAPI.create(formData);
        showToast('Brand created successfully', 'success');
      }

      setShowForm(false);
      setEditingBrand(null);
      resetForm();
      fetchBrands();
    } catch (error) {
      showToast('Error saving brand', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteBrandId) return;
    
    try {
      await brandAPI.delete(deleteBrandId);
      showToast('Brand deleted successfully', 'success');
      fetchBrands();
      setDeleteBrandId(null);
    } catch (error) {
      showToast('Error deleting brand', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brand Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage product brands</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingBrand(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Brand
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No brands found</h3>
            <p className="text-slate-600">Get started by adding your first brand</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-700">Name</th>
                  <th className="text-left p-4 font-medium text-slate-700">Description</th>
                  <th className="text-left p-4 font-medium text-slate-700">Created</th>
                  <th className="text-left p-4 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((brand) => (
                  <tr key={brand._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{brand.name}</td>
                    <td className="p-4 text-slate-600">
                      {brand.description || '-'}
                    </td>
                    <td className="p-4 text-slate-700">
                      {new Date(brand.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteBrandId(brand._id)}
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingBrand ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteBrandId}
        title="Delete Brand"
        message="Are you sure you want to delete this brand? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteBrandId(null)}
      />
    </div>
  );
}
