import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, Users as UsersIcon, Layout, Shield, LogOut, Save, Plus, Trash2, Edit2, Phone, Database, ChevronRight, Download, Eye, EyeOff, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import { LocalStorageDB } from '../utils/localStorage';
import { usersAPI } from '../utils/api';
import { showToast } from '../utils/toast';
import ConfirmDialog from './ConfirmDialog';
import SkeletonLoader, { CardSkeleton } from './SkeletonLoader';
import FormBuilderSettings from './FormBuilderSettings';
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
  const [showPassword, setShowPassword] = useState(false);
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

      if (editingUser) {
        // Update existing user
        const updateData: any = {
          email: userForm.email,
          role: userForm.role,
        };
        
        // Only update password if provided
        if (userForm.password && userForm.password.length >= 6) {
          updateData.password = userForm.password;
        }

        await usersAPI.update(editingUser.id, updateData);
        
        await fetchUsers();
        
        setShowUserForm(false);
        setUserForm({ email: '', password: '', role: 'Staff' });
        setEditingUser(null);
        setLoading(false);
        showToast('User updated successfully.', 'success');
      } else {
        // Create new user
        if (!userForm.password || userForm.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        if (userForm.email && userForm.password) {
          await usersAPI.create({
            email: userForm.email,
            password: userForm.password,
            role: userForm.role,
          });

          await fetchUsers();
          
          setShowUserForm(false);
          setUserForm({ email: '', password: '', role: 'Staff' });
          setEditingUser(null);
          setLoading(false);
          showToast('User created successfully.', 'success');
        } else {
          throw new Error('Email and password are required');
        }
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      setLoading(false);
      showToast(error.message || 'Failed to save user', 'error');
    }
  };

  const handleUpdateUser = async (userId: string, newRole: 'Admin' | 'Staff') => {
    try {
      await usersAPI.updateRole(userId, newRole);
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
        await usersAPI.delete(userId);
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
      const allUsers = await usersAPI.getAll();
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
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-tight mb-2 sm:mb-3">Settings</h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">Manage your system settings and preferences</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">User Role</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">{user?.role || 'Staff'}</span>
          </div>
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10">System Status</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">Active</span>
          </div>
        </div>
      </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <UsersIcon className="w-5 h-5" />
                Users
              </button>
            )}
            {user?.role === 'Admin' && (
              <button
                onClick={() => setActiveTab('form-builder')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
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
            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
                  <button
                    onClick={() => {
                      setShowUserForm(true);
                      setUserForm({ email: '', password: '', role: 'Staff' });
                      setEditingUser(null);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add User
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                              <UsersIcon className="text-slate-300" size={24} />
                            </div>
                            <p className="text-slate-500 font-medium">No users found</p>
                            <p className="text-sm mt-2 text-slate-400">Click "Add User" to create your first user</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((userItem) => (
                        <tr key={userItem.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">{userItem.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}>
                              {userItem.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {new Date(userItem.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setUserForm({
                                    email: userItem.email,
                                    password: '',
                                    role: userItem.role,
                                  });
                                  setEditingUser(userItem);
                                  setShowUserForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const newRole = userItem.role === 'Admin' ? 'Staff' : 'Admin';
                                  handleUpdateUser(userItem.id, newRole);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Toggle role"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              {userItem.role !== 'Admin' && (
                                <button
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete user"
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
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
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
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 transition-all shadow-lg"
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
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 transition-all shadow-lg"
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
className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 transition-all shadow-lg"
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md">
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Password {editingUser && <span className="text-slate-400 font-normal">(leave empty to keep current)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingUser}
                        minLength={editingUser ? undefined : 6}
                        title={editingUser ? '' : 'Password must be at least 6 characters'}
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        placeholder={editingUser ? 'Enter new password (optional)' : 'Enter password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
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
                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
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
