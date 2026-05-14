import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Download, Upload, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Investment } from '../types';
import { investmentsAPI, formConfigAPI } from '../utils/api';
import * as XLSX from 'xlsx';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import DynamicFields from './DynamicFields';
import { DynamicFormField } from '../types/formConfig';
import { showToast } from '../utils/toast';
import SkeletonLoader, { TableSkeleton } from './SkeletonLoader';
import DatePickerField from './DatePickerField';

interface InvestmentManagementProps {
  onToggleSidebar?: () => void;
}

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

/** ---- Investment Excel import: multiple header layouts + Excel dates / currency ---- */
function normalizeInvestmentHeader(h: string): string {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[_.]+/g, ' ')
    .trim();
}

const INVEST_VENDOR_ALIASES = [
  'vendor name',
  'vendor',
  'party name',
  'party',
  'supplier name',
  'supplier',
  'payee',
  'paid to',
  'beneficiary',
  'creditor',
  'vendor party',
];

const INVEST_PARTICULAR_ALIASES = [
  'particular',
  'particulars',
  'particular name',
  'particular of payment',
  'payment particulars',
  'description',
  'narration',
  'details',
  'remarks',
  'purpose',
  'memo',
  'bill details',
  'reference',
  'transaction details',
];

const INVEST_DATE_ALIASES = [
  'date',
  'transaction date',
  'voucher date',
  'inv date',
  'invoice date',
  'dt',
  'dated',
  'value date',
];

const INVEST_SR_ALIASES = [
  'sr. no',
  'sr no',
  'sr.no',
  's.no',
  's no',
  'serial no',
  'serial number',
  'sl no',
  'sl. no',
  'no.',
];

const INVEST_UNIT_ALIASES = ['unit', 'units', 'qty', 'quantity'];

const INVEST_PAY_THROUGH_ALIASES = [
  'payment through',
  'payment mode',
  'mode',
  'pay mode',
  'instrument',
  'payment type',
];

const INVEST_PAY_BY_ALIASES = ['payment by', 'paid by', 'booked by', 'employee', 'by', 'entered by'];

function findInvestmentColumnIndex(headers: string[], aliases: string[]): number {
  const norms = headers.map(normalizeInvestmentHeader);
  for (const alias of aliases) {
    const a = normalizeInvestmentHeader(alias);
    if (!a) continue;
    const idx = norms.findIndex((n) => n === a);
    if (idx !== -1) return idx;
  }
  for (const alias of aliases) {
    const a = normalizeInvestmentHeader(alias);
    if (a.length < 3) continue;
    const idx = norms.findIndex((n) => n.startsWith(a + ' ') || n.startsWith(a + '('));
    if (idx !== -1) return idx;
  }
  for (const alias of aliases) {
    const a = normalizeInvestmentHeader(alias);
    if (a.length < 4) continue;
    const idx = norms.findIndex((n) => n.includes(a));
    if (idx !== -1) return idx;
  }
  for (const alias of aliases) {
    const a = normalizeInvestmentHeader(alias);
    if (a.length > 3) continue;
    const idx = norms.findIndex((n) => n === a);
    if (idx !== -1) return idx;
  }
  return -1;
}

function findInvestmentTotalColumnIndex(headers: string[]): number {
  const norms = headers.map(normalizeInvestmentHeader);
  const blocked = (n: string) =>
    n.includes('subtotal') ||
    n.includes('sub total') ||
    n.includes('grand total') ||
    n.includes('opening') ||
    n.includes('closing');

  const tryExact = (want: string) => {
    const w = normalizeInvestmentHeader(want);
    const i = norms.findIndex((n) => !blocked(n) && n === w);
    return i;
  };

  for (const key of ['total', 'amount', 'net amount', 'debit', 'credit', 'total amount', 'net']) {
    const i = tryExact(key);
    if (i !== -1) return i;
  }
  const fuzzy = findInvestmentColumnIndex(headers, [
    'value',
    'rs',
    'rs.',
    'inr',
    'amt',
    'amount inr',
    'payment amount',
  ]);
  if (fuzzy !== -1 && !blocked(norms[fuzzy])) return fuzzy;
  return -1;
}

function scoreInvestmentHeaderRow(headers: string[]): number {
  const v = findInvestmentColumnIndex(headers, INVEST_VENDOR_ALIASES);
  const p = findInvestmentColumnIndex(headers, INVEST_PARTICULAR_ALIASES);
  const t = findInvestmentTotalColumnIndex(headers);
  let score = 0;
  if (v !== -1) score += 3;
  if (p !== -1) score += 3;
  if (t !== -1) score += 2;
  return score;
}

function pickInvestmentHeaderRowIndex(rawData: any[][]): number {
  let bestIdx = -1;
  let bestScore = -1;
  const maxScan = Math.min(rawData.length, 80);
  for (let i = 0; i < maxScan; i++) {
    const headers = rawData[i].map((c) => String(c).trim());
    if (headers.filter(Boolean).length < 2) continue;
    const s = scoreInvestmentHeaderRow(headers);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  if (bestScore >= 5) return bestIdx;

  // Ledger-style: description / narration + amount (no "vendor" in headers)
  for (let i = 0; i < maxScan; i++) {
    const rowText = rawData[i].map(String).join(' ').toLowerCase();
    const hasParticularish =
      /\b(particular|description|narration|remarks|details|memo)\b/.test(rowText) ||
      rowText.includes('particular');
    const hasAmountish =
      /\b(amount|total|debit|credit|rs\.?|inr|₹)\b/.test(rowText) || rowText.includes('amount');
    if (hasParticularish && hasAmountish) {
      const headers = rawData[i].map((c) => String(c).trim());
      const p = findInvestmentColumnIndex(headers, INVEST_PARTICULAR_ALIASES);
      const t = findInvestmentTotalColumnIndex(headers);
      if (p !== -1 && t !== -1) return i;
    }
  }

  return bestIdx;
}

function investmentCellAt(row: any[], idx: number): unknown {
  if (idx < 0 || idx >= row.length) return '';
  const v = row[idx];
  return v === null || v === undefined ? '' : v;
}

function parseInvestmentMoney(raw: unknown): number {
  if (raw === '' || raw === null || raw === undefined) return 0;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  let s = String(raw).trim();
  s = s.replace(/[₹\s\u00a0,]/g, '');
  s = s.replace(/[()]/g, '');
  s = s.replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

function parseInvestmentInteger(raw: unknown, fallback: number): number {
  const n = parseInt(String(raw).replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(n) || n < 1 ? fallback : n;
}

/** Excel serial or display string -> YYYY-MM-DD */
function parseInvestmentSheetDate(raw: unknown): string {
  if (raw === '' || raw === null || raw === undefined) {
    return new Date().toISOString().split('T')[0];
  }
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    if (raw > 20000 && raw < 120000) {
      const ms = Math.round((raw - 25569) * 86400 * 1000);
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
  }
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  if (str.includes('/')) {
    const parts = str.split(/[/\sT]/).filter(Boolean);
    if (parts.length >= 3) {
      let p0 = parseInt(parts[0], 10);
      let p1 = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      let day: number;
      let month: number;
      if (p0 > 12) {
        day = p0;
        month = p1;
      } else if (p1 > 12) {
        month = p0;
        day = p1;
      } else {
        day = p0;
        month = p1;
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

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
      // Check if vendor_name is required in dynamic form config
      const vendorField = dynamicFields.find(f => f.key === 'vendor_name');
      if (vendorField?.required && !formData.vendor_name.trim()) {
        showToast('Vendor name is required.', 'error');
        return;
      }
      // Check if particular is required in dynamic form config
      const particularField = dynamicFields.find(f => f.key === 'particular');
      if (particularField?.required && !formData.particular.trim()) {
        showToast('Particular is required.', 'error');
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
    const inputEl = e.target as HTMLInputElement;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: '',
        });

        if (rawData.length === 0) {
          throw new Error('File is completely empty.');
        }

        const headerRowIndex = pickInvestmentHeaderRowIndex(rawData);
        if (headerRowIndex === -1) {
          throw new Error(
            'Could not find a header row. Supported layouts: (1) App export — Vendor Name, Particular, Total, Date, etc. ' +
              '(2) Bank / ledger — Description or Narration with Amount / Debit / Credit.'
          );
        }

        const headers = rawData[headerRowIndex].map((c) => String(c).trim());
        const vendorIdx = findInvestmentColumnIndex(headers, INVEST_VENDOR_ALIASES);
        const particularIdx = findInvestmentColumnIndex(headers, INVEST_PARTICULAR_ALIASES);
        const totalIdx = findInvestmentTotalColumnIndex(headers);
        const dateIdx = findInvestmentColumnIndex(headers, INVEST_DATE_ALIASES);
        const srIdx = findInvestmentColumnIndex(headers, INVEST_SR_ALIASES);
        const unitIdx = findInvestmentColumnIndex(headers, INVEST_UNIT_ALIASES);
        const payThroughIdx = findInvestmentColumnIndex(headers, INVEST_PAY_THROUGH_ALIASES);
        const payByIdx = findInvestmentColumnIndex(headers, INVEST_PAY_BY_ALIASES);

        if (particularIdx === -1 && vendorIdx === -1) {
          throw new Error(
            'No Particular / Description / Narration column (and no Vendor column) was found. Check spelling in the header row.'
          );
        }
        if (totalIdx === -1) {
          throw new Error(
            'No Total / Amount column was found. Expected headers like "Total", "Amount", "Debit", or "Credit".'
          );
        }

        const mappedData = rawData
          .slice(headerRowIndex + 1)
          .filter((rowArray) => rowArray.some((cell) => cell !== '' && cell !== null && cell !== undefined))
          .map((rowArray) => {
            let vendor_name = String(investmentCellAt(rowArray, vendorIdx)).trim();
            let particular = String(investmentCellAt(rowArray, particularIdx)).trim();

            // Format A: both vendor + particular. Format B: ledger — description + amount only
            if (!vendor_name && particular) {
              vendor_name = 'Miscellaneous';
            }
            if (vendor_name && !particular) {
              particular = vendor_name;
            }
            if (!vendor_name && !particular) {
              return null;
            }

            const total = parseInvestmentMoney(investmentCellAt(rowArray, totalIdx));

            const dateRaw = dateIdx >= 0 ? investmentCellAt(rowArray, dateIdx) : '';
            const date = parseInvestmentSheetDate(dateRaw);

            return {
              sr_no: String(investmentCellAt(rowArray, srIdx) ?? '').trim(),
              date,
              vendor_name,
              particular,
              unit: parseInvestmentInteger(investmentCellAt(rowArray, unitIdx), 1),
              total,
              payment_through: String(investmentCellAt(rowArray, payThroughIdx) ?? '').trim(),
              payment_by: String(investmentCellAt(rowArray, payByIdx) ?? '').trim(),
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              user_id: '',
            };
          });

        const validMappedData = mappedData.filter((x): x is NonNullable<typeof x> => x !== null);

        if (validMappedData.length === 0) {
          throw new Error('No valid data rows found after the header.');
        }

        await investmentsAPI.createBulk(validMappedData as Investment[]);

        showToast(`Successfully imported ${validMappedData.length} investments from Excel.`, 'success');
        setShowImportModal(false);
        fetchInvestments();
      } catch (error: any) {
        console.error('Error importing file:', error);
        showToast(`Error importing file: ${error.message || 'Please check the format.'}`, 'error');
      } finally {
        inputEl.value = '';
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
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
        <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <SkeletonLoader height="h-10 sm:h-12" width="w-40 sm:w-48" className="mb-3" />
            <SkeletonLoader height="h-5 sm:h-6" width="w-56 sm:w-64" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 border border-slate-100 min-w-[140px] sm:min-w-[180px]">
              <SkeletonLoader height="h-3 sm:h-4" width="w-16 sm:w-20" className="mb-2" />
              <SkeletonLoader height="h-7 sm:h-8" width="w-20 sm:w-28" />
            </div>
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 border border-slate-100 min-w-[140px] sm:min-w-[180px]">
              <SkeletonLoader height="h-3 sm:h-4" width="w-16 sm:w-20" className="mb-2" />
              <SkeletonLoader height="h-7 sm:h-8" width="w-20 sm:w-28" />
            </div>
          </div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-tight sm:leading-normal">Investment Management</h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">Manage your investments and track expenses</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Total Investments</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">₹{filteredInvestments.reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}</span>
          </div>
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10">Total Items</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">{filteredInvestments.length}</span>
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
              placeholder="Search investments by vendor, particular, or payment..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 focus:bg-white transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
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
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-sm font-bold ml-2 active:scale-95"
              >
                <Plus size={18} strokeWidth={3} />
                <span className="hidden sm:inline">Add Investment</span>
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
          <div className="bg-slate-50/50 px-4 sm:px-6 py-4 border-t border-slate-100">
            {/* Desktop Pagination */}
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
            
            {/* Mobile Pagination */}
            <div className="flex sm:hidden items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              
              <span className="text-sm font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
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
                    <label className="text-xs font-bold text-slate-700 ml-1">
                      Vendor Name {dynamicFields.find(f => f.key === 'vendor_name')?.required && '*'}
                    </label>
                    <input
                      type="text"
                      required={dynamicFields.find(f => f.key === 'vendor_name')?.required}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">
                      Particular {dynamicFields.find(f => f.key === 'particular')?.required && '*'}
                    </label>
                    <input
                      type="text"
                      required={dynamicFields.find(f => f.key === 'particular')?.required}
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
                className="px-6 sm:px-10 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
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
                <div className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl cursor-pointer active:scale-[0.98]">
                  Browse Files
                </div>
              </label>

              <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-sm">
                Two layouts: (1) Export-style — Vendor Name, Particular, Total, Date. (2) Ledger / bank — Description or
                Narration + Amount (missing vendor is stored as Miscellaneous). Commas and Excel dates are supported.
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
