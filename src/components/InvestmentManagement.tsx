import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Download, Upload, AlertTriangle, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Investment } from '../types';
import { investmentsAPI, formConfigAPI } from '../utils/api';
import * as XLSX from 'xlsx';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import DynamicFields from './DynamicFields';
import { DynamicFormField } from '../types/formConfig';
import { showToast } from '../utils/toast';
import DatePickerField from './DatePickerField';

// Helper for date formatting to ensure consistency
const formatDateForDisplay = (dateStr: any) => {
  if (!dateStr || String(dateStr) === 'Invalid Date') return 'N/A';
  try {
    const str = String(dateStr);
    let d;
    if (str.includes('-')) {
       const [y, m, day_part] = str.split('-');
       d = new Date(Number(y), parseInt(m) - 1, Number(day_part));
    } else if (str.includes('/')) {
       const [day_part, m, y] = str.split('/');
       const year = y.trim().length === 2 ? 2000 + Number(y.trim()) : Number(y.trim());
       d = new Date(year, parseInt(m) - 1, Number(day_part));
    } else {
       d = new Date(str);
    }

    if (isNaN(d.getTime())) return dateStr;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};

export default function InvestmentManagement() {
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin';
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [filteredInvestments, setFilteredInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteInvestmentId, setDeleteInvestmentId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const coreFieldKeys = new Set(['sr_no', 'date', 'vendor_name', 'particular', 'unit', 'total', 'payment_through', 'payment_by']);
  const extraDynamicFields = dynamicFields.filter((f) => !coreFieldKeys.has(f.key));

  const [formData, setFormData] = useState({
    sr_no: '',
    date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    particular: '',
    unit: 1,
    total: 0,
    payment_through: '',
    payment_by: '',
  });

  useEffect(() => {
    fetchInvestments();
    fetchDynamicFields();
  }, []);

  useEffect(() => {
    filterInvestments();
  }, [investments, searchTerm]);

  const fetchInvestments = async () => {
    try {
      const data = await investmentsAPI.getAll();
      const normalized = (data || []).map((investment: any) => ({
        ...investment,
        id: investment.id || investment._id,
      }));
      setInvestments(normalized);
      setFilteredInvestments(normalized); // Set filtered data initially
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicFields = async () => {
    try {
      const data = await formConfigAPI.getByModule('investments');
      setDynamicFields((data?.fields || []).filter((f: DynamicFormField) => f.enabled !== false));
    } catch (error) {
      console.error('Error fetching investment form config:', error);
      setDynamicFields([]);
    }
  };

  const filterInvestments = () => {
    let filtered = [...investments];

    // Sort by date descending (newest first)
    filtered.sort((a, b) => {
      const parseForSort = (dateStr: any, fallback: string) => {
        if (!dateStr) return new Date(fallback).getTime();
        const str = String(dateStr);
        
        // Handle YYYY-MM-DD (Internal format)
        if (str.includes('-')) {
          const parts = str.split('-');
          if (parts[0].length === 4) { // YYYY-MM-DD
            return new Date(Number(parts[0]), parseInt(parts[1], 10) - 1, Number(parts[2])).getTime();
          }
          return new Date(str).getTime();
        }

        // Handle DD/MM/YYYY (Excel/User format)
        if (str.includes('/')) {
          const [d, m, y] = str.split('/');
          const year = y.trim().length === 2 ? 2000 + Number(y.trim()) : Number(y.trim());
          const month = parseInt(m.trim(), 10) - 1;
          const day = parseInt(d.trim(), 10);
          return new Date(year, month, day).getTime();
        }

        const parsed = new Date(str);
        return isNaN(parsed.getTime()) ? new Date(fallback).getTime() : parsed.getTime();
      };

      const timeA = parseForSort(a.date, a.created_at || '');
      const timeB = parseForSort(b.date, b.created_at || '');
      
      if (timeB !== timeA) return timeB - timeA;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    if (searchTerm) {
      filtered = filtered.filter(investment =>
        investment.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investment.particular.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investment.payment_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvestments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.vendor_name.trim() || !formData.particular.trim()) {
        showToast('Vendor name and particular are required.', 'error');
        return;
      }
      if (Number(formData.unit) < 1) {
        showToast('Unit must be at least 1.', 'error');
        return;
      }
      if (Number(formData.total) < 0) {
        showToast('Total cannot be negative.', 'error');
        return;
      }
      if (editingInvestment) {
        await investmentsAPI.update(editingInvestment.id, { ...formData, custom_fields: customFieldValues });
        showToast('Investment updated successfully.', 'success');
      } else {
        await investmentsAPI.create({ ...formData, custom_fields: customFieldValues });
        showToast('Investment created successfully.', 'success');
      }

      setShowForm(false);
      setEditingInvestment(null);
      resetForm();
      fetchInvestments();
    } catch (error) {
      console.error('Error saving investment:', error);
      showToast('Error saving investment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      sr_no: investment.sr_no,
      date: investment.date,
      vendor_name: investment.vendor_name,
      particular: investment.particular,
      unit: investment.unit,
      total: investment.total,
      payment_through: investment.payment_through,
      payment_by: investment.payment_by,
    });
    setCustomFieldValues((investment as any).custom_fields || {});
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    try {
      await investmentsAPI.delete(id);
      fetchInvestments();
      showToast('Investment deleted successfully.', 'success');
    } catch (error) {
      console.error('Error deleting investment:', error);
      showToast('Error deleting investment.', 'error');
    } finally {
      setDeleteInvestmentId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      sr_no: '',
      date: new Date().toISOString().split('T')[0],
      vendor_name: '',
      particular: '',
      unit: 1,
      total: 0,
      payment_through: '',
      payment_by: '',
    });
    setCustomFieldValues({});
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredInvestments.map(investment => ({
      'SR. NO': investment.sr_no,
      'DATE': investment.date,
      'Vendor Name': investment.vendor_name,
      'Particular': investment.particular,
      'Unit': investment.unit,
      'Total': investment.total,
      'Payment Through': investment.payment_through,
      'Payment By': investment.payment_by,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Investments');
    XLSX.writeFile(wb, 'investments_export.xlsx');
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

        // Read as array of arrays to safely find the header row
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawData.length === 0) {
          throw new Error('File is completely empty.');
        }

        // Find the actual header row by looking for key terms
        let headerRowIndex = -1;
        for (let i = 0; i < rawData.length; i++) {
          const rowText = rawData[i].map(String).join(' ').toLowerCase();
          if (rowText.includes('vendor') || rowText.includes('particular') || rowText.includes('total')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not identify a valid header row. Ensure your sheet has headers like "Vendor Name", "Particular" or "Total".');
        }

        const headers = rawData[headerRowIndex].map(String).map(h => h.trim());
        const dataRows = rawData.slice(headerRowIndex + 1);

        // Map data rows using detected headers
        const rowErrors: string[] = [];
        const mappedData = dataRows
          .filter(rowArray => rowArray.some(cell => cell !== '' && cell !== null && cell !== undefined)) // Skip empty rows
          .map((rowArray, rowIndex) => {
            const row: Record<string, any> = {};
            headers.forEach((header, index) => {
              if (header) {
                // Normalize the header slightly for lookup, but store as original
                row[header] = rowArray[index];
                row[header.toLowerCase()] = rowArray[index];
              }
            });

            // Helper to find a value across possible key matches
            const findVal = (...keys: string[]) => {
              for (const k of keys) {
                // Check original case and lower case exact matches
                if (row[k] !== undefined && row[k] !== '') return row[k];
                if (row[k.toLowerCase()] !== undefined && row[k.toLowerCase()] !== '') return row[k.toLowerCase()];
              }
              return '';
            };

            const excelRowNumber = headerRowIndex + 2 + rowIndex; // +2 because header row + 1-based Excel row

            const vendor_name = String(
              findVal('Vendor Name', 'vendor_name', 'Vendor', 'vendor')
            ).trim();
            const particular = String(
              findVal(
                'Particular',
                'Particulars',
                'Particular Name',
                'particular',
                'particulars',
                'particular_name'
              )
            ).trim();

            if (!vendor_name || !particular) {
              const missing: string[] = [];
              if (!vendor_name) missing.push('Vendor Name');
              if (!particular) missing.push('Particular');
              rowErrors.push(
                `Row ${excelRowNumber}: missing ${missing.join(' and ')}`
              );
              return null;
            }

            return {
              sr_no: String(findVal('SR. NO', 'sr_no', 'Sr No')),
              date: findVal('DATE', 'date', 'Date') || new Date().toISOString().split('T')[0],
              vendor_name,
              particular,
              unit: parseInt(findVal('Unit', 'unit')) || 1,
              total: parseFloat(findVal('Total', 'total')) || 0,
              payment_through: String(findVal('Payment Through', 'payment_through')),
              payment_by: String(findVal('Payment By', 'payment_by')),
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              user_id: '' // Satisfies generic requirement
            };
          });

        const validMappedData = mappedData.filter((x): x is NonNullable<typeof x> => x !== null);

        if (validMappedData.length === 0) {
          throw new Error('No valid data rows found after the header.');
        }

        // Insert data using bulk insert for better speed
        await investmentsAPI.createBulk(validMappedData as Investment[]);

        const debugInfo = `
Total Raw Rows Found: ${rawData.length}
Header Row Index Used: ${headerRowIndex}
Headers Detected: ${JSON.stringify(headers).substring(0, 100)}...
First Mapped Row: ${JSON.stringify(validMappedData[0]).substring(0, 150)}...
        `;
        const skippedText = rowErrors.length
          ? `\n\nSkipped ${rowErrors.length} invalid row(s):\n${rowErrors.slice(0, 5).join('\n')}${rowErrors.length > 5 ? '\n...' : ''}`
          : '';
        showToast(`Successfully imported ${validMappedData.length} investments from Excel.${skippedText}`, 'success');
        setShowImportModal(false);
        fetchInvestments();
      } catch (error: any) {
        console.error('Error importing file:', error);
        showToast(`Error importing file: ${error.message || 'Please check the format.'}`, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const paginatedInvestments = filteredInvestments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInvestments.length / itemsPerPage);

  if (loading && investments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading investments...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50/30 min-h-screen font-sans">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">Investment Management</h1>
          <p className="text-slate-500 font-medium text-lg">Manage your investments and track expenses</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Total Investments</span>
            <span className="text-3xl font-black text-slate-900 relative z-10">₹{filteredInvestments.reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}</span>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10">Total Items</span>
            <span className="text-3xl font-black text-emerald-600 relative z-10">{filteredInvestments.length}</span>
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
              placeholder="Search investments by vendor, particular, or payment..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 focus:bg-white transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
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

              {canDelete && (
                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-95"
                  title="Clear Database"
                >
                  <Trash2 size={20} />
                </button>
              )}

              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingInvestment(null);
                  resetForm();
                }}
                className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.2)] text-sm font-bold ml-2 active:scale-95"
              >
                <Plus size={18} strokeWidth={3} />
                Create Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Table */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">SR. NO</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vendor Name</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Particular</th>
                <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Through</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment By</th>
                <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedInvestments.map((investment) => (
                <tr key={investment.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                      {investment.sr_no || '---'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                    {formatDateForDisplay(investment.date)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                    {investment.vendor_name}
                  </td>
                  <td className="px-5 py-4 max-w-[240px]">
                    <span className="text-sm font-bold text-slate-900 truncate" title={investment.particular}>{investment.particular}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-black text-slate-900">
                    {investment.unit.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                    {investment.total.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                    {investment.payment_through}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                    {investment.payment_by}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(investment)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteInvestmentId(investment.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
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
          
          {paginatedInvestments.length === 0 && (
            <div className="px-5 py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-slate-300" size={24} />
              </div>
              <p className="text-slate-500 font-medium">No investments found matching your criteria</p>
              <p className="text-slate-400 text-sm mt-1">
                {investments.length === 0
                  ? 'No investment data yet. Create your first entry.'
                  : 'Try changing search or filters.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredInvestments.length > itemsPerPage && (
          <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Showing <span className="text-slate-900 font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredInvestments.length)}</span> of <span className="text-slate-900 font-bold">{filteredInvestments.length}</span> entries
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm space-x-1" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    
                    if (totalPages <= maxVisible + 2) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (currentPage > 3) pages.push('...');
                      
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      
                      for (let i = start; i <= end; i++) {
                        if (!pages.includes(i)) pages.push(i);
                      }
                      
                      if (currentPage < totalPages - 2) pages.push('...');
                      if (!pages.includes(totalPages)) pages.push(totalPages);
                    }
                    
                    return pages.map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        disabled={page === '...'}
                        className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          currentPage === page
                            ? 'z-10 bg-slate-900 text-white shadow-lg shadow-slate-200'
                            : page === '...'
                            ? 'text-slate-400 cursor-default'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Investment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingInvestment ? 'Edit Investment Entry' : 'New Investment Entry'}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Fill in the details for the investment record
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingInvestment(null);
                  resetForm();
                }}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <form id="investment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
              <section className="space-y-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-center">Core Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">SR. NO</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      value={formData.sr_no}
                      onChange={(e) => setFormData({ ...formData, sr_no: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Date *</label>
                    <DatePickerField
                      value={formData.date}
                      onChange={(value) => setFormData({ ...formData, date: value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Vendor Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Particular *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      value={formData.particular}
                      onChange={(e) => setFormData({ ...formData, particular: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-center">Amount & Payment</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Unit *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Total *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Payment Through *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      value={formData.payment_through}
                      onChange={(e) => setFormData({ ...formData, payment_through: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Payment By *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      value={formData.payment_by}
                      onChange={(e) => setFormData({ ...formData, payment_by: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              <DynamicFields
                fields={extraDynamicFields}
                values={customFieldValues}
                onChange={(key, value) => setCustomFieldValues((prev) => ({ ...prev, [key]: value }))}
              />

            </form>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingInvestment(null);
                  resetForm();
                }}
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-white transition-all border border-transparent hover:border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="investment-form"
                className="px-10 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                {editingInvestment ? 'Update Record' : 'Save Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Bulk Import Excel</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <Upload size={36} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Select your Excel file</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 max-w-xs leading-relaxed">
                The system will automatically detect headers and import your investment data.
              </p>

              <label className="w-full">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileImport}
                />
                <div className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 cursor-pointer active:scale-[0.98]">
                  Browse Files
                </div>
              </label>

              <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Required columns: Vendor Name, Particular
              </p>
            </div>
          </div>
        </div>
      )}

      {canDelete && (
        <ConfirmDialog
          isOpen={!!deleteInvestmentId}
          title="Delete Investment"
          message="Are you sure you want to delete this investment?"
          confirmText="Delete"
          onCancel={() => setDeleteInvestmentId(null)}
          onConfirm={() => deleteInvestmentId && handleDelete(deleteInvestmentId)}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          isOpen={showClearAllConfirm}
          title="Clear All Investments"
          message="Are you sure you want to clear ALL investment data?"
          confirmText="Clear All"
          onCancel={() => setShowClearAllConfirm(false)}
          onConfirm={async () => {
            await investmentsAPI.deleteAll();
            setShowClearAllConfirm(false);
            fetchInvestments();
            showToast('All investment records cleared.', 'success');
          }}
        />
      )}
    </div>
  );
}
