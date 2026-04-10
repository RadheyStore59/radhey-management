import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Download, Upload, Phone } from 'lucide-react';
import { Courier } from '../types';
import { courierAPI, formConfigAPI } from '../utils/api';
import * as XLSX from 'xlsx';
import ConfirmDialog from './ConfirmDialog';
import DynamicFields from './DynamicFields';
import { DynamicFormField } from '../types/formConfig';
import { showToast } from '../utils/toast';
import { isValidPhone10 } from '../utils/validation';
import DatePickerField from './DatePickerField';
import SelectField from './SelectField';
import SkeletonLoader, { TableSkeleton } from './SkeletonLoader';

interface CourierManagementProps {
}

export default function CourierManagement() {
  const [courierRecords, setCourierRecords] = useState<Courier[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Courier | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const coreFieldKeys = new Set([
    'date', 'tracking_number', 'courier_company', 'sender_name', 'sender_phone', 'sender_address',
    'recipient_name', 'recipient_phone', 'recipient_address', 'shipment_date', 'delivery_date',
    'weight', 'cost', 'status', 'remarks', 'vendor_name', 'particular', 'unit', 'total', 'payment_through', 'payment_by'
  ]);
  const extraDynamicFields = dynamicFields.filter((f) => !coreFieldKeys.has(f.key));

  const [formData, setFormData] = useState({
    date: '',
    vendor_name: '',
    particular: '',
    unit: '',
    total: '',
    payment_through: '',
    payment_by: '',
    status: 'Pending' as Courier['status'],
    remarks: '',
    tracking_number: '',
    courier_company: '',
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    shipment_date: '',
    delivery_date: '',
    weight: '',
    cost: '',
  });

  const courierCompanies = [
    'DTDC',
    'Delhivery',
    'Blue Dart',
    'Ecom Express',
    'Xpressbees',
    'India Post',
    'Shadowfax',
    'Other',
  ];
  const paymentThroughOptions = ['Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Debit Card', 'Cheque', 'Online Payment'];
  const statusOptions: Courier['status'][] = ['Pending', 'Completed', 'Cancelled', 'Refunded'];
  const statusSelectOptions = statusOptions.map((status) => ({ value: status, label: status }));
  const courierCompanyOptions = courierCompanies.map((company) => ({ value: company, label: company }));

  useEffect(() => {
    fetchRecords();
    fetchDynamicFields();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [courierRecords, searchTerm, statusFilter]);

  const fetchRecords = async () => {
    try {
      const data = await courierAPI.getAll();
      const normalized = (data || []).map((record: any) => ({
        ...record,
        id: record.id || record._id,
      }));
      setCourierRecords(normalized);
      setFilteredRecords(normalized);
    } catch (error) {
      console.error('Error fetching courier records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicFields = async () => {
    try {
      const data = await formConfigAPI.getByModule('courier');
      setDynamicFields((data?.fields || []).filter((f: DynamicFormField) => f.enabled !== false));
    } catch (error) {
      console.error('Error fetching courier form config:', error);
      setDynamicFields([]);
    }
  };

  const filterRecords = () => {
    let filtered = courierRecords;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.particular.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.payment_through.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.payment_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isValidPhone10(formData.sender_phone) || !isValidPhone10(formData.recipient_phone)) {
        showToast('Sender and recipient phone numbers must be exactly 10 digits.', 'error');
        return;
      }
      // Keep legacy `total` and new `cost` in sync so UI/API show same amount.
      const amount = String(formData.cost || formData.total || '');
      const payload = { ...formData, cost: amount, total: amount, custom_fields: customFieldValues };

      if (editingRecord) {
        await courierAPI.update(editingRecord.id, payload);
        showToast('Courier record updated successfully.', 'success');
      } else {
        await courierAPI.create(payload);
        showToast('Courier record created successfully.', 'success');
      }
      fetchRecords();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving courier record:', error);
      showToast('Error saving courier record.', 'error');
    }
  };

  const handleEdit = (record: Courier) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      vendor_name: record.vendor_name,
      particular: record.particular,
      unit: record.unit,
      total: record.total || record.cost || '',
      payment_through: record.payment_through,
      payment_by: record.payment_by,
      status: record.status,
      remarks: record.remarks,
      tracking_number: record.tracking_number || '',
      courier_company: record.courier_company || '',
      sender_name: record.sender_name || '',
      sender_phone: record.sender_phone || '',
      sender_address: record.sender_address || '',
      recipient_name: record.recipient_name || '',
      recipient_phone: record.recipient_phone || '',
      recipient_address: record.recipient_address || '',
      shipment_date: record.shipment_date || '',
      delivery_date: record.delivery_date || '',
      weight: record.weight || '',
      cost: record.cost || record.total || '',
    });
    setCustomFieldValues((record as any).custom_fields || {});
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await courierAPI.delete(id);
      fetchRecords();
      showToast('Courier record deleted successfully.', 'success');
    } catch (error) {
      console.error('Error deleting courier record:', error);
      showToast('Error deleting courier record.', 'error');
    } finally {
      setDeleteRecordId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      vendor_name: '',
      particular: '',
      unit: '',
      total: '',
      payment_through: '',
      payment_by: '',
      status: 'Pending',
      remarks: '',
      tracking_number: '',
      courier_company: '',
      sender_name: '',
      sender_phone: '',
      sender_address: '',
      recipient_name: '',
      recipient_phone: '',
      recipient_address: '',
      shipment_date: '',
      delivery_date: '',
      weight: '',
      cost: '',
    });
    setCustomFieldValues({});
  };

  const getStatusColor = (status: Courier['status']) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRecords.map(record => ({
      'Date': record.date,
      'Vendor Name': record.vendor_name,
      'Particular': record.particular,
      'Unit': record.unit,
      'Total': record.total,
      'Payment Through': record.payment_through,
      'Payment By': record.payment_by,
      'Status': record.status,
      'Remarks': record.remarks,
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courier Records');
    XLSX.writeFile(wb, `courier-records-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Process and import data
      data.forEach((row: any) => {
        const record = {
          date: row['Date'] || '',
          vendor_name: row['Vendor Name'] || '',
          particular: row['Particular'] || '',
          unit: row['Unit'] || '',
          total: row['Total'] || '',
          payment_through: row['Payment Through'] || '',
          payment_by: row['Payment By'] || '',
          status: row['Status'] || 'Pending',
          remarks: row['Remarks'] || '',
        };
        courierAPI.create(record);
      });
      
      fetchRecords();
      setShowImportModal(false);
      showToast('Courier records imported successfully.', 'success');
    };
    reader.readAsBinaryString(file);
  };

  if (loading && courierRecords.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <SkeletonLoader height="h-10 sm:h-12" width="w-40 sm:w-48" className="mb-3 sm:mb-4" />
          <SkeletonLoader height="h-5 sm:h-6" width="w-56 sm:w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
              <SkeletonLoader height="h-3 sm:h-4" width="w-16 sm:w-20" className="mb-2" />
              <SkeletonLoader height="h-7 sm:h-8" width="w-20 sm:w-24" />
            </div>
          ))}
        </div>
        <TableSkeleton rows={8} columns={8} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-tight mb-2 sm:mb-3">Courier Cost</h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">Manage courier shipments and tracking</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-emerald-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Completed</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">{filteredRecords.filter(r => r.status === 'Completed').length}</span>
          </div>
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-400 to-orange-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-yellow-500 uppercase tracking-widest relative z-10">Pending</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-600 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">{filteredRecords.filter(r => r.status === 'Pending').length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-center">
          <div className="flex-1 relative w-full group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" size={18} />
            <input
              type="text"
              placeholder="Search by tracking number, sender, recipient, or company..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 focus:bg-white transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="min-w-[160px] sm:min-w-[180px]">
              <SelectField
                value={statusFilter}
                options={[{ value: 'all', label: 'All Status' }, ...statusSelectOptions]}
                onChange={setStatusFilter}
                placeholder="Status"
              />
            </div>

            <div className="h-10 w-[1px] bg-slate-100 hidden lg:block mx-1"></div>

            <div className="flex items-center gap-2 ml-auto lg:ml-0">
              <button
                onClick={exportToExcel}
                className="p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 active:scale-95"
                title="Export Data"
              >
                <Download size={20} />
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 active:scale-95"
                title="Bulk Import"
              >
                <Upload size={20} />
              </button>

              <button
                onClick={() => setShowClearAllConfirm(true)}
                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-95"
                title="Clear Database"
              >
                <Trash2 size={20} />
              </button>

              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-sm font-bold ml-2 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Courier</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Courier Records Table */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr className="bg-slate-50/50">
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tracking #</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Courier Company</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sender</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recipient</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shipment Date</th>
                <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cost</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4 text-slate-400" />
                      {record.tracking_number}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-900">{record.courier_company}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{record.sender_name}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {record.sender_phone}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{record.recipient_name}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {record.recipient_phone}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-900">{record.shipment_date}</td>
                  <td className="px-5 py-4 text-right text-sm font-black text-slate-900">Rs {Number(record.cost || record.total || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(record)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Entry"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteRecordId(record.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Entry"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="text-slate-300" size={24} />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {courierRecords.length === 0
                          ? 'No courier cost records yet. Add your first entry.'
                          : 'No courier records found matching your criteria'}
                      </p>
                      {courierRecords.length === 0 ? (
                        <button
                          onClick={() => {
                            setShowForm(true);
                            setEditingRecord(null);
                            resetForm();
                          }}
                          className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                        >
                          Add first courier record
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingRecord ? 'Edit Courier Record' : 'Add New Courier Record'}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Fill in the details for the courier record</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <form id="courier-form" onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tracking Number *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Courier Company *</label>
                  <SelectField
                    value={formData.courier_company}
                    options={courierCompanyOptions}
                    onChange={(value) => setFormData({ ...formData, courier_company: value })}
                    placeholder="Select Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sender Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.sender_name}
                    onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sender Phone *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{10}"
                    minLength={10}
                    maxLength={10}
                    title="Enter exactly 10 digits"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.sender_phone}
                    onChange={(e) => setFormData({ ...formData, sender_phone: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sender Address</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.sender_address}
                    onChange={(e) => setFormData({ ...formData, sender_address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Phone *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{10}"
                    minLength={10}
                    maxLength={10}
                    title="Enter exactly 10 digits"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.recipient_phone}
                    onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Address</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.recipient_address}
                    onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Shipment Date</label>
                  <DatePickerField
                    value={formData.shipment_date}
                    onChange={(value) => setFormData({ ...formData, shipment_date: value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Date</label>
                  <DatePickerField
                    value={formData.delivery_date}
                    onChange={(value) => setFormData({ ...formData, delivery_date: value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cost</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <SelectField
                    value={formData.status}
                    options={statusSelectOptions}
                    onChange={(value) => setFormData({ ...formData, status: value as Courier['status'] })}
                    placeholder="Status"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <DynamicFields
                    fields={extraDynamicFields}
                    values={customFieldValues}
                    onChange={(key, value) => setCustomFieldValues((prev) => ({ ...prev, [key]: value }))}
                  />
                </div>
              </div>

            </form>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-white transition-all border border-transparent hover:border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="courier-form"
                className="px-6 sm:px-10 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                {editingRecord ? 'Update' : 'Add'} Courier Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 w-full max-w-md">
            <h2 className="text-xl font-black text-slate-900 mb-4">Import Courier Records</h2>
            <p className="text-slate-600 mb-6">Upload an Excel file with courier records data</p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
                id="file-upload-courier"
              />
              <label
                htmlFor="file-upload-courier"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                Choose file or drag and drop
              </label>
              <p className="text-slate-500 text-sm mt-2">Excel files only</p>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteRecordId}
        title="Delete Courier Record"
        message="Are you sure you want to delete this courier record?"
        confirmText="Delete"
        onCancel={() => setDeleteRecordId(null)}
        onConfirm={() => deleteRecordId && handleDelete(deleteRecordId)}
      />

      <ConfirmDialog
        isOpen={showClearAllConfirm}
        title="Clear All Courier Records"
        message="Are you sure you want to clear ALL courier records data?"
        confirmText="Clear All"
        onCancel={() => setShowClearAllConfirm(false)}
        onConfirm={async () => {
          await courierAPI.deleteAll();
          setShowClearAllConfirm(false);
          fetchRecords();
          showToast('All courier records cleared.', 'success');
        }}
      />
    </div>
  );
}
