import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Building, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import { showToast } from '../utils/toast';
import ConfirmDialog from './ConfirmDialog';
import SkeletonLoader, { TableSkeleton } from './SkeletonLoader';

interface Dealer {
  _id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

const dealerAPI = {
  getAll: async () => {
    const response = await fetch('/api/dealers');
    if (!response.ok) throw new Error('Failed to fetch dealers');
    return response.json();
  },
  create: async (data: any) => {
    const response = await fetch('/api/dealers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create dealer');
    return response.json();
  },
  update: async (id: string, data: any) => {
    const response = await fetch(`/api/dealers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update dealer');
    return response.json();
  },
  delete: async (id: string) => {
    const response = await fetch(`/api/dealers/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete dealer');
    return response.json();
  }
};

export default function DealerManagement() {
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin';
  
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [deleteDealerId, setDeleteDealerId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const dl = await dealerAPI.getAll();
      setDealers(dl);
    } catch (error) {
      showToast('Failed to fetch dealers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDealer) {
        await dealerAPI.update(editingDealer._id, formData);
        showToast('Dealer updated successfully', 'success');
      } else {
        await dealerAPI.create(formData);
        showToast('Dealer created successfully', 'success');
      }

      setShowForm(false);
      setEditingDealer(null);
      resetForm();
      fetchDealers();
    } catch (error) {
      showToast('Error saving dealer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setFormData({
      name: dealer.name,
      contact_person: dealer.contact_person || '',
      phone: dealer.phone || '',
      email: dealer.email || '',
      address: dealer.address || ''
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDealerId) return;
    
    try {
      await dealerAPI.delete(deleteDealerId);
      showToast('Dealer deleted successfully', 'success');
      fetchDealers();
      setDeleteDealerId(null);
    } catch (error) {
      showToast('Error deleting dealer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const filteredDealers = dealers.filter(dealer =>
    dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dealer.contact_person && dealer.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (dealer.phone && dealer.phone.includes(searchTerm)) ||
    (dealer.email && dealer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dealer Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage dealers and suppliers</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingDealer(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Dealer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search dealers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Dealers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : filteredDealers.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No dealers found</h3>
            <p className="text-slate-600">Get started by adding your first dealer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-700">Name</th>
                  <th className="text-left p-4 font-medium text-slate-700">Contact Person</th>
                  <th className="text-left p-4 font-medium text-slate-700">Phone</th>
                  <th className="text-left p-4 font-medium text-slate-700">Email</th>
                  <th className="text-left p-4 font-medium text-slate-700">Address</th>
                  <th className="text-left p-4 font-medium text-slate-700">Created</th>
                  <th className="text-left p-4 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDealers.map((dealer) => (
                  <tr key={dealer._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-900">{dealer.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">
                      {dealer.contact_person || '-'}
                    </td>
                    <td className="p-4 text-slate-700">
                      {dealer.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-slate-400" />
                          {dealer.phone}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-slate-700">
                      {dealer.email ? (
                        <div className="flex items-center gap-1">
                          <Mail size={14} className="text-slate-400" />
                          {dealer.email}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-slate-700">
                      {dealer.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="max-w-xs truncate">{dealer.address}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-slate-700">
                      {new Date(dealer.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(dealer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteDealerId(dealer._id)}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingDealer ? 'Edit Dealer' : 'Add New Dealer'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dealer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  {loading ? 'Saving...' : (editingDealer ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteDealerId}
        title="Delete Dealer"
        message="Are you sure you want to delete this dealer? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDealerId(null)}
      />
    </div>
  );
}
