import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Upload, Calendar, AlertCircle } from 'lucide-react';
import { Gst } from '../types';
import { gstAPI, formConfigAPI } from '../utils/api';
import * as XLSX from 'xlsx';
import ConfirmDialog from './ConfirmDialog';
import DynamicFields from './DynamicFields';
import { DynamicFormField } from '../types/formConfig';
import { showToast } from '../utils/toast';
import DatePickerField from './DatePickerField';
import SelectField from './SelectField';

export default function GstManagement() {
  const [gstRecords, setGstRecords] = useState<Gst[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Gst[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Gst | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const coreFieldKeys = new Set(['filing_month', 'filing_year', 'turnover', 'tax_paid', 'due_date', 'filing_date', 'status', 'remarks']);
  const extraDynamicFields = dynamicFields.filter((f) => !coreFieldKeys.has(f.key));

  const [formData, setFormData] = useState({
    filing_month: '',
    filing_year: new Date().getFullYear().toString(),
    turnover: '',
    tax_paid: '',
    due_date: '',
    filing_date: '',
    status: 'Pending' as Gst['status'],
    remarks: '',
  });

  const statusOptions: Gst['status'][] = ['Pending', 'Filed', 'Late Filed', 'Not Filed'];
  const statusSelectOptions = statusOptions.map((status) => ({ value: status, label: status }));

  useEffect(() => {
    fetchRecords();
    fetchDynamicFields();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [gstRecords, searchTerm, statusFilter]);

  const fetchRecords = async () => {
    try {
      const data = await gstAPI.getAll();
      const normalized = (data || []).map((record: any) => ({
        ...record,
        id: record.id || record._id,
      }));
      setGstRecords(normalized);
      setFilteredRecords(normalized);
    } catch (error) {
      console.error('Error fetching GST records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicFields = async () => {
    try {
      const data = await formConfigAPI.getByModule('gst');
      setDynamicFields((data?.fields || []).filter((f: DynamicFormField) => f.enabled !== false));
    } catch (error) {
      console.error('Error fetching GST form config:', error);
      setDynamicFields([]);
    }
  };

  const filterRecords = () => {
    let filtered = gstRecords;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.filing_month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.filing_year.toLowerCase().includes(searchTerm.toLowerCase())
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
      if (!formData.filing_month.trim()) {
        showToast('Filing month is required.', 'error');
        return;
      }
      if (!/^\d{4}$/.test(formData.filing_year)) {
        showToast('Filing year must be 4 digits.', 'error');
        return;
      }
      if (formData.tax_paid !== '' && Number(formData.tax_paid) < 0) {
        showToast('Tax paid cannot be negative.', 'error');
        return;
      }
      if (formData.turnover !== '' && Number(formData.turnover) < 0) {
        showToast('Turnover cannot be negative.', 'error');
        return;
      }
      if (editingRecord) {
        await gstAPI.update(editingRecord.id, { ...formData, custom_fields: customFieldValues });
        showToast('GST record updated successfully.', 'success');
      } else {
        await gstAPI.create({ ...formData, custom_fields: customFieldValues });
        showToast('GST record created successfully.', 'success');
      }
      fetchRecords();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving GST record:', error);
      showToast('Error saving GST record.', 'error');
    }
  };

  const handleEdit = (record: Gst) => {
    setEditingRecord(record);
    setFormData({
      filing_month: record.filing_month,
      filing_year: record.filing_year,
      turnover: record.turnover || '',
      tax_paid: record.tax_paid,
      due_date: record.due_date,
      filing_date: record.filing_date,
      status: record.status,
      remarks: record.remarks,
    });
    setCustomFieldValues((record as any).custom_fields || {});
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await gstAPI.delete(id);
      fetchRecords();
      showToast('GST record deleted successfully.', 'success');
    } catch (error) {
      console.error('Error deleting GST record:', error);
      showToast('Error deleting GST record.', 'error');
    } finally {
      setDeleteRecordId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      filing_month: '',
      filing_year: new Date().getFullYear().toString(),
      turnover: '',
      tax_paid: '',
      due_date: '',
      filing_date: '',
      status: 'Pending',
      remarks: '',
    });
    setCustomFieldValues({});
  };

  const getStatusColor = (status: Gst['status']) => {
    switch (status) {
      case 'Filed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Late Filed': return 'bg-orange-100 text-orange-800';
      case 'Not Filed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRecords.map(record => ({
      'Filing Month': record.filing_month,
      'Filing Year': record.filing_year,
      'Tax Paid (Rs)': record.tax_paid,
      'Due Date': record.due_date,
      'Filing Date': record.filing_date,
      'Status': record.status,
      'Remarks': record.remarks,
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GST Records');
    XLSX.writeFile(wb, `gst-records-${new Date().toISOString().split('T')[0]}.xlsx`);
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
          filing_month: row['Filing Month'] || '',
          filing_year: row['Filing Year'] || new Date().getFullYear().toString(),
          tax_paid: row['Tax Paid (Rs)'] || '',
          due_date: row['Due Date'] || '',
          filing_date: row['Filing Date'] || '',
          status: row['Status'] || 'Pending',
          remarks: row['Remarks'] || '',
        };
        gstAPI.create(record);
      });
      
      fetchRecords();
      setShowImportModal(false);
      showToast('GST records imported successfully.', 'success');
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-8 bg-gray-50/30 min-h-screen font-sans">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">GST Monthly Filing</h1>
          <p className="text-slate-500 font-medium text-lg">Manage your GST returns and compliance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Total Filed</span>
            <span className="text-3xl font-black text-slate-900 relative z-10">{filteredRecords.filter(r => r.status === 'Filed').length}</span>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest relative z-10">Pending</span>
            <span className="text-3xl font-black text-orange-600 relative z-10">{filteredRecords.filter(r => r.status === 'Pending').length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 mb-8 backdrop-blur-sm bg-white/80">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1 relative w-full group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" size={18} />
            <input
              type="text"
              placeholder="Search by filing month or return type..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 focus:bg-white transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="min-w-[180px]">
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
                className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.2)] text-sm font-bold ml-2 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add GST Record
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GST Records Table */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr className="bg-slate-50/50">
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month/Year</th>
                <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tax Paid (Rs)</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-12 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No GST Records Found</h3>
                      <p className="text-slate-500 mb-6">
                        {gstRecords.length === 0
                          ? 'Get started by adding your first GST filing record'
                          : 'No GST records match your current search or status filter'}
                      </p>
                      {gstRecords.length === 0 ? (
                        <button
                          onClick={() => {
                            setShowForm(true);
                            setEditingRecord(null);
                            resetForm();
                          }}
                          className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                        >
                          Add first GST record
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          className="text-blue-600 font-bold text-sm hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {record.filing_month} {record.filing_year}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-black text-slate-900">Rs {Number(record.tax_paid || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-900">{record.due_date}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingRecord ? 'Edit GST Record' : 'Add New GST Record'}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Fill in the details for the GST record</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <form id="gst-form" onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Filing Month *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.filing_month}
                    onChange={(e) => setFormData({ ...formData, filing_month: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Filing Year *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.filing_year}
                    onChange={(e) => setFormData({ ...formData, filing_year: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Turnover</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.turnover}
                    onChange={(e) => setFormData({ ...formData, turnover: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tax Paid</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.tax_paid}
                    onChange={(e) => setFormData({ ...formData, tax_paid: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Filing Date</label>
                  <DatePickerField
                    value={formData.filing_date}
                    onChange={(value) => setFormData({ ...formData, filing_date: value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <SelectField
                    value={formData.status}
                    options={statusSelectOptions}
                    onChange={(value) => setFormData({ ...formData, status: value as Gst['status'] })}
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
                form="gst-form"
                className="px-10 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                {editingRecord ? 'Update' : 'Add'} GST Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 w-full max-w-md">
            <h2 className="text-xl font-black text-slate-900 mb-4">Import GST Records</h2>
            <p className="text-slate-600 mb-6">Upload an Excel file with GST records data</p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
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
        title="Delete GST Record"
        message="Are you sure you want to delete this GST record?"
        confirmText="Delete"
        onCancel={() => setDeleteRecordId(null)}
        onConfirm={() => deleteRecordId && handleDelete(deleteRecordId)}
      />

      <ConfirmDialog
        isOpen={showClearAllConfirm}
        title="Clear All GST Records"
        message="Are you sure you want to clear ALL GST records data?"
        confirmText="Clear All"
        onCancel={() => setShowClearAllConfirm(false)}
        onConfirm={async () => {
          await gstAPI.deleteAll();
          setShowClearAllConfirm(false);
          fetchRecords();
          showToast('All GST records cleared.', 'success');
        }}
      />
    </div>
  );
}
