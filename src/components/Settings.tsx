import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import { LocalStorageDB } from '../utils/localStorage';
import { Settings as SettingsIcon, LogOut, Users, Database, Download, Trash2, Plus, ChevronRight } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import FormBuilderSettings from './FormBuilderSettings';
import { showToast } from '../utils/toast';
import { isValidEmail } from '../utils/validation';
import SelectField from './SelectField';

interface UserSettings {
  id: string;
  email: string;
  role: 'Admin' | 'Staff';
  created_at: string;
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'form-builder' | 'system'>('profile');
  const [users, setUsers] = useState<UserSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSettings | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('Confirm Action');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'Staff' as 'Admin' | 'Staff',
  });
  const [whatsAppTemplates, setWhatsAppTemplates] = useState({
    leads: '',
    sales: '',
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'system') {
      const templates = LocalStorageDB.getWhatsAppTemplates();
      setWhatsAppTemplates({
        leads: templates.leads,
        sales: templates.sales,
      });
    }
  }, [activeTab]);

  const saveWhatsAppTemplates = () => {
    LocalStorageDB.saveWhatsAppTemplates(whatsAppTemplates);
    showToast('WhatsApp templates saved successfully.', 'success');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isValidEmail(userForm.email)) {
        throw new Error('Please enter a valid email address');
      }
      if (!userForm.password || userForm.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (userForm.email && userForm.password) {
        LocalStorageDB.addUser({
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
        });

        const allUsers = LocalStorageDB.getUsers();
        setUsers(allUsers);
        
        setShowUserForm(false);
        setUserForm({ email: '', password: '', role: 'Staff' });
        setEditingUser(null);
        setLoading(false);
        showToast('User created successfully.', 'success');
      } else {
        throw new Error('Email and password are required');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      setLoading(false);
      showToast(error.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (userId: string, newRole: 'Admin' | 'Staff') => {
    try {
      LocalStorageDB.updateUser(userId, { role: newRole });
      await fetchUsers();
      showToast('User role updated successfully.', 'success');
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast('Error updating user role.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setConfirmTitle('Delete User');
    setConfirmMessage('Are you sure you want to delete this user?');
    setConfirmAction(() => async () => {
      try {
        LocalStorageDB.deleteUser(userId);
        await fetchUsers();
        showToast('User deleted successfully.', 'success');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user.', 'error');
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  const fetchUsers = async () => {
    try {
      const allUsers = LocalStorageDB.getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Fetch users failed:', error);
      setUsers([]);
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <>
      <div className="p-8 bg-gray-50/30 min-h-screen font-sans">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">Settings</h1>
            <p className="text-slate-500 font-medium text-lg">Manage your system settings and preferences</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">User Role</span>
              <span className="text-3xl font-black text-slate-900 relative z-10">{user?.role || 'Staff'}</span>
            </div>
            <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10">System Status</span>
              <span className="text-3xl font-black text-emerald-600 relative z-10">Active</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 mb-8 backdrop-blur-sm bg-white/80">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              Profile
            </button>
            {user?.role === 'Admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Users className="w-5 h-5" />
                Users
              </button>
            )}
            {user?.role === 'Admin' && (
              <button
                onClick={() => setActiveTab('form-builder')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'form-builder'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Database className="w-5 h-5" />
                Form Builder
              </button>
            )}
            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Database className="w-5 h-5" />
              System
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-slate-100">
            <div className="flex items-center gap-8 mb-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <SettingsIcon className="w-10 h-10" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Profile Settings</h3>
                <p className="text-slate-500 mt-1">Manage your account information</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={user?.role || 'Staff'}
                    disabled
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && user?.role === 'Admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">User Management</h3>
                <button
                  onClick={() => {
                    setShowUserForm(true);
                    setUserForm({ email: '', password: '', role: 'Staff' });
                    setEditingUser(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add User
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center">
                          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p>No users found</p>
                          <p className="text-sm mt-2">Click "Add User" to create your first user</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {userItem.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newRole = userItem.role === 'Admin' ? 'Staff' : 'Admin';
                                handleUpdateUser(userItem.id, newRole);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            {userItem.role !== 'Admin' && (
                              <button
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'form-builder' && user?.role === 'Admin' && (
          <FormBuilderSettings />
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-slate-100">
              <div className="border rounded-xl p-4 mb-6">
                <h4 className="font-medium text-slate-900 mb-3">WhatsApp Message Templates</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Placeholders: {'{{customerName}}'}, {'{{productName}}'}, {'{{phaseMessage}}'} (sales — text for current phase), {'{{phase}}'}, {'{{orderId}}'}, {'{{phone}}'}, {'{{brand}}'} (e.g. Radhey Personlized Gifts).
                  <span className="block mt-2 text-slate-500">
                    Sales layout example: Hello → product line → phase message → brand line. Use line breaks for WhatsApp.
                  </span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Leads Template</label>
                    <textarea
                      rows={4}
                      value={whatsAppTemplates.leads}
                      onChange={(e) => setWhatsAppTemplates((prev) => ({ ...prev, leads: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sales Template</label>
                    <textarea
                      rows={4}
                      value={whatsAppTemplates.sales}
                      onChange={(e) => setWhatsAppTemplates((prev) => ({ ...prev, sales: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={saveWhatsAppTemplates}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
                    >
                      Save Templates
                    </button>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <h4 className="font-medium text-slate-900 mb-3">Export Data</h4>
                <p className="text-sm text-slate-600 mb-4">Download backup copies of your data</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const data = LocalStorageDB.getLeads();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `leads_backup_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Export Leads
                  </button>
                  <button
                    onClick={() => {
                      const data = LocalStorageDB.getSales();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `sales_backup_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Export Sales
                  </button>
                  <button
                    onClick={() => {
                      const data = LocalStorageDB.getInvestments();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `investments_backup_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Export Investments
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-slate-100">
              <div className="border rounded-xl p-4">
                <h4 className="font-medium text-slate-900 mb-3">System Information</h4>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Application</span>
                    <span className="font-medium">Radhey Management System</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Version</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Database</span>
                    <span className="font-medium">MongoDB Atlas</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Last Backup</span>
                    <span className="font-medium">Not available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-black text-slate-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      title="Password must be at least 6 characters"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                    <SelectField
                      value={userForm.role}
                      options={[
                        { value: 'Staff', label: 'Staff' },
                        { value: 'Admin', label: 'Admin' },
                      ]}
                      onChange={(value) => setUserForm({ ...userForm, role: value as 'Admin' | 'Staff' })}
                      placeholder="Select role"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false);
                      setEditingUser(null);
                      setUserForm({ email: '', password: '', role: 'Staff' });
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          confirmText="Confirm"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => confirmAction && confirmAction()}
        />
      </div>
    </>
  );
}
