import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Download, Upload, Calculator, Eye, ChevronLeft, ChevronRight, ChevronDown, Calendar, Phone } from 'lucide-react';
import { Sale } from '../types';
import { salesAPI, formConfigAPI } from '../utils/api';
import * as XLSX from 'xlsx';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import DynamicFields from './DynamicFields';
import { DynamicFormField } from '../types/formConfig';
import { showToast } from '../utils/toast';
import { isValidPhone10 } from '../utils/validation';
import DatePickerField from './DatePickerField';
import SelectField from './SelectField';
import { openWhatsAppWithTemplate } from '../utils/whatsapp';
import SkeletonLoader, { TableSkeleton } from './SkeletonLoader';

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

const getPhaseBadgeClass = (phase?: string) => {
  switch ((phase || '').toLowerCase()) {
    case 'order taken':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'in process':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'order ready':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'dispatched':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

interface SalesManagementProps {
}

export default function SalesManagement() {
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin';
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [clientPaymentFilter, setClientPaymentFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    invoice_number: '',
    radhey_invoice: '',
    order_date: new Date().toISOString().split('T')[0],
    order_taken_date: new Date().toISOString().split('T')[0],
    order_ready_date: new Date().toISOString().split('T')[0],
    product_name: '',
    customer_name: '',
    dealer_name: '',
    phone_no: '',
    reference: '',
    phase: 'Order Taken' as NonNullable<Sale['phase']>,
    deal: '',
    dispatch_date: new Date().toISOString().split('T')[0],
    quantity: 1,
    buy_price: 0,
    sell_price: 0,
    profit: 0,
    payment_by: '',
    payment_through: '',
    received_through_client: '',
    profit_given: '',
    remarks: '',
  });
  const paymentStatusOptions = [
    { value: 'all', label: 'All Payment Status' },
    { value: 'received', label: 'Settled (Paid)' },
    { value: 'pending', label: 'Outstanding (Pending)' },
  ];
  const phaseOptions: { value: NonNullable<Sale['phase']>; label: NonNullable<Sale['phase']> }[] = [
    { value: 'Order Taken', label: 'Order Taken' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Order Ready', label: 'Order Ready' },
    { value: 'Dispatched', label: 'Dispatched' },
    { value: 'Delivered', label: 'Delivered' },
  ];


  useEffect(() => {
    fetchSales();
    fetchDynamicFields();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, dateFilter, clientPaymentFilter, phaseFilter]);

  useEffect(() => {
    const profit = formData.sell_price - formData.buy_price;
    setFormData(prev => ({ ...prev, profit }));
  }, [formData.buy_price, formData.sell_price]);

  const fetchSales = async () => {
    try {
      const data = await salesAPI.getAll();
      const normalized = (data || []).map((sale: any) => ({
        ...sale,
        id: sale.id || sale._id,
      }));
      setSales(normalized);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicFields = async () => {
    try {
      const data = await formConfigAPI.getByModule('sales');
      setDynamicFields((data?.fields || []).filter((f: DynamicFormField) => f.enabled !== false));
    } catch (error) {
      console.error('Error fetching sales form config:', error);
      setDynamicFields([]);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Sort by order_date descending (newest first)
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
          // If it's something else with - like DD-MM-YYYY
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

      const timeA = parseForSort(a.order_date, a.created_at);
      const timeB = parseForSort(b.order_date, b.created_at);
      
      if (timeB !== timeA) return timeB - timeA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.dealer_name && sale.dealer_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(sale => 
        sale.order_date === dateFilter
      );
    }

    if (clientPaymentFilter !== 'all') {
      filtered = filtered.filter(sale => {
        const status = (sale.received_through_client || '').toLowerCase();
        if (clientPaymentFilter === 'pending') {
          return status === 'pending' || status === '';
        }
        if (clientPaymentFilter === 'received') {
          return status !== 'pending' && status !== '';
        }
        return true;
      });
    }

    if (phaseFilter !== 'all') {
      filtered = filtered.filter(sale => sale.phase === phaseFilter);
    }

    setFilteredSales(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isValidPhone10(formData.phone_no)) {
        showToast('Phone number must be exactly 10 digits.', 'error');
        return;
      }
      if (editingSale) {
        await salesAPI.update(editingSale.id, { ...formData, custom_fields: customFieldValues });
        showToast('Sale updated successfully.', 'success');
      } else {
        await salesAPI.create({ ...formData, custom_fields: customFieldValues });
        showToast('Sale created successfully.', 'success');
      }

      setShowForm(false);
      setEditingSale(null);
      resetForm();
      fetchSales();
    } catch (error) {
      console.error('Error saving sale:', error);
      showToast('Error saving sale.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sale: Sale) => {
    setFormData({
      invoice_number: sale.invoice_number,
      radhey_invoice: sale.radhey_invoice,
      order_date: sale.order_date,
      order_taken_date: sale.order_taken_date,
      order_ready_date: sale.order_ready_date,
      product_name: sale.product_name,
      customer_name: sale.customer_name,
      dealer_name: sale.dealer_name,
      phone_no: sale.phone_no,
      reference: sale.reference,
      phase: sale.phase || 'Order Taken',
      deal: sale.deal,
      dispatch_date: sale.dispatch_date,
      quantity: sale.quantity,
      buy_price: sale.buy_price,
      sell_price: sale.sell_price,
      profit: sale.profit,
      payment_by: sale.payment_by,
      payment_through: sale.payment_through,
      received_through_client: sale.received_through_client,
      profit_given: String(sale.profit_given || ''),
      remarks: sale.remarks,
    });
    setCustomFieldValues((sale as any).custom_fields || {});
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    try {
      await salesAPI.delete(id);
      fetchSales();
      showToast('Sale deleted successfully.', 'success');
    } catch (error) {
      console.error('Error deleting sale:', error);
      showToast('Error deleting sale.', 'error');
    } finally {
      setDeleteSaleId(null);
    }
  };

  const handleSendWhatsApp = (sale: Sale) => {
    const opened = openWhatsAppWithTemplate({
      module: 'sales',
      customerName: sale.customer_name,
      phone: sale.phone_no,
      orderId: sale.product_name,
      productName: sale.product_name,
      phase: sale.phase || 'Order Taken',
    });
    if (!opened) {
      showToast('Invalid phone number for WhatsApp.', 'error');
    }
  };

  const handlePhaseChange = async (sale: Sale, phase: NonNullable<Sale['phase']>) => {
    try {
      await salesAPI.update(sale.id, { phase });
      setSales((prev) => prev.map((s) => (s.id === sale.id ? { ...s, phase } : s)));
      showToast('Phase updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating phase:', error);
      showToast('Error updating phase.', 'error');
    }
  };

  const handlePaymentStatusChange = async (sale: Sale, status: string) => {
    try {
      await salesAPI.update(sale.id, { received_through_client: status });
      setSales((prev) => prev.map((s) => (s.id === sale.id ? { ...s, received_through_client: status } : s)));
      showToast('Payment status updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('Error updating payment status.', 'error');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredSales.map(sale => ({
      'Sr.no.': sale.id,
      'Invoice No.': sale.invoice_number,
      'Radhey Invoice': sale.radhey_invoice,
      'Order date': sale.order_date,
      'Order Taken Date': sale.order_taken_date,
      'Order Ready Date': sale.order_ready_date,
      'Product name': sale.product_name,
      'Customer name': sale.customer_name,
      'Reference': sale.reference,
      'Phase': sale.phase || 'Order Taken',
      'Dealer Name': sale.dealer_name,
      'Phone No.': sale.phone_no,
      'Deal': sale.deal,
      'Dispatch date': sale.dispatch_date,
      'Quantity': sale.quantity,
      'Buy price': sale.buy_price,
      'Sell price': sale.sell_price,
      'Profit': sale.profit,
      'Payment By': sale.payment_by,
      'Payment Through': sale.payment_through,
      'We Received Through Clinet': sale.received_through_client,
      'Profit Given': sale.profit_given,
      'Remarks': sale.remarks,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, 'sales_export.xlsx');
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
        
        // Use raw: false to get formatted strings as seen in Excel, avoiding locale issues
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
        
        if (rawData.length === 0) {
          throw new Error('File is completely empty.');
        }

        // Find the actual header row by looking for key terms
        let headerRowIndex = -1;
        for (let i = 0; i < rawData.length; i++) {
          const rowText = rawData[i].map(String).join(' ').toLowerCase();
          if (rowText.includes('invoice') || rowText.includes('product') || rowText.includes('customer')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not identify a valid header row. Ensure your sheet has headers like "Invoice No.", "Product Name" or "Customer Name".');
        }

        const headers = rawData[headerRowIndex].map(String).map(h => h.trim());
        const dataRows = rawData.slice(headerRowIndex + 1);

        // Map data rows using detected headers
        const rowErrors: string[] = [];
        const mappedData = dataRows
          .filter(rowArray => {
            // Skip empty rows
            if (!rowArray.some(cell => cell !== '' && cell !== null && cell !== undefined)) return false;
            
            // Skip template rows (containing "Required" or "Optional")
            const rowText = rowArray.join(' ');
            if (rowText.includes('Required ') || rowText.includes('Optional ')) return false;
            
            return true;
          })
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

            const parseNum = (val: any) => {
              if (typeof val === 'string') {
                val = val.replace(/[₹,]/g, '');
              }
              return parseFloat(val) || 0;
            };

            const parseDate = (val: any) => {
              if (!val) return new Date().toISOString().split('T')[0];
              try {
                const str = String(val).trim();
                if (str.includes('/')) {
                   const parts = str.split('/');
                   if (parts.length === 3) {
                      // Handle DD/MM/YYYY strictly (e.g., 03/04/2026 = April 3rd)
                      const d = parts[0].trim().padStart(2, '0');
                      const m = parts[1].trim().padStart(2, '0');
                      let y = parts[2].trim();
                      if (y.length === 2) y = `20${y}`;
                      // Ensure month and day are also valid strings before returning
                      return `${y}-${m}-${d}`;
                   }
                }
                if (typeof val === 'number') {
                  const date = XLSX.SSF.parse_date_code(val);
                  return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                }
                // Handle existing YYYY-MM-DD
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                   const year = d.getFullYear();
                   const month = String(d.getMonth() + 1).padStart(2, '0');
                   const day = String(d.getDate()).padStart(2, '0');
                   return `${year}-${month}-${day}`;
                }
                return str;
              } catch (e) {
                return String(val);
              }
            };

            let qtyStr = findVal('Quantity', 'Qauntity', 'quantity', 'Qty');
            let qty = parseInt(String(qtyStr).replace(/,/g, '')) || 1;
            let buy = parseNum(findVal('Buy price', 'Buy Price', 'buy_price'));
            let sell = parseNum(findVal('Sell price', 'Sell Price', 'sell_price', 'Rate'));
            let orderDate = parseDate(findVal('Order date', 'order_date', 'Order Date', 'Sales Date'));
            let dispatchDate = parseDate(findVal('Dispatch date', 'dispatch_date', 'Dispatch Date'));

            const srNo = String(findVal('Sr.no.', 'Sr No', 'Sr No.', 'sr_no', 'srno')).trim();
            const invoiceNumberRaw = String(findVal('Invoice No.', 'Invoice Number', 'invoice_number')).trim();
            const invoice_number = invoiceNumberRaw || (srNo ? `SR-${srNo}` : `AUTO-${Date.now()}`);

            const excelRowNumber = headerRowIndex + 2 + rowIndex; // +2 because header row + 1-based Excel row

            const product_name = String(findVal('Product name', 'Product Name', 'product_name')).trim();
            const customer_name = String(findVal('Customer name', 'Customer Name', 'customer_name')).trim();

            if (!product_name || !customer_name) {
              const missing: string[] = [];
              if (!product_name) missing.push('Product Name');
              if (!customer_name) missing.push('Customer Name');
              rowErrors.push(
                `Row ${excelRowNumber}: missing ${missing.join(' and ')}`
              );
              return null;
            }

            return {
              invoice_number,
              radhey_invoice: String(findVal('Radhey Invoice', 'radhey_invoice')),
              order_date: orderDate,
              order_taken_date: parseDate(findVal('Order Taken Date', 'order_taken_date')),
              order_ready_date: parseDate(findVal('Order Ready Date', 'order_ready_date')),
              product_name,
              customer_name,
              dealer_name: String(findVal('Dealer Name', 'Dealer name', 'dealer_name', 'Dealer')),
              phone_no: String(findVal('Phone No.', 'Phone Number', 'Mobile Number', 'phone_no')),
              reference: String(findVal('Reference', 'reference')),
              phase: String(findVal('Phase', 'Status', 'phase', 'status')) || 'Order Taken',
              deal: String(findVal('Deal', 'deal')),
              dispatch_date: dispatchDate,
              quantity: qty,
              buy_price: buy,
              sell_price: sell,
              profit: parseNum(findVal('Profit', 'profit')) || (sell - buy),
              payment_by: String(findVal('Payment By', 'payment_by', 'Sales Person')),
              payment_through: String(findVal('Payment Through', 'payment_through', 'Payment Mode')),
              received_through_client: String(findVal('We Received Through Clinet', 'We Received Through Client', 'received_through_client')),
              profit_given: String(findVal('Profit Given', 'profit_given', 'Partner Settlement')),
              remarks: String(findVal('Remarks', 'remarks', 'Notes')),
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
        await salesAPI.createBulk(validMappedData as Sale[]);

        const debugInfo = `
Total Raw Rows Found: ${rawData.length}
Header Row Index Used: ${headerRowIndex}
Headers Detected: ${JSON.stringify(headers).substring(0, 100)}...
First Mapped Row: ${JSON.stringify(validMappedData[0]).substring(0, 150)}...
        `;
        const skippedText = rowErrors.length
          ? `\n\nSkipped ${rowErrors.length} invalid row(s):\n${rowErrors.slice(0, 5).join('\n')}${rowErrors.length > 5 ? '\n...' : ''}`
          : '';
        showToast(`Successfully imported ${validMappedData.length} sales from Excel.${skippedText}`, 'success');
        setShowImportModal(false);
        fetchSales();
      } catch (error: any) {
        console.error('Error importing file:', error);
        showToast(`Error importing file: ${error.message || 'Please check the format.'}`, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      radhey_invoice: '',
      order_date: new Date().toISOString().split('T')[0],
      order_taken_date: new Date().toISOString().split('T')[0],
      order_ready_date: new Date().toISOString().split('T')[0],
      product_name: '',
      customer_name: '',
      dealer_name: '',
      phone_no: '',
      reference: '',
      phase: 'Order Taken',
      deal: '',
      dispatch_date: new Date().toISOString().split('T')[0],
      quantity: 1,
      buy_price: 0,
      sell_price: 0,
      profit: 0,
      payment_by: '',
      payment_through: '',
      received_through_client: '',
      profit_given: '',
      remarks: '',
    });
    setCustomFieldValues({});
  };

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  if (loading && sales.length === 0) {
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
        <TableSkeleton rows={8} columns={7} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-tight sm:leading-normal">Sales Ledger</h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">Manage your commercial transactions and business growth</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Gross Revenue</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">₹{filteredSales.reduce((sum, s) => sum + (s.sell_price || 0), 0).toLocaleString()}</span>
          </div>
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10">Net Profit</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">₹{filteredSales.reduce((sum, s) => sum + (s.profit || 0), 0).toLocaleString()}</span>
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
              placeholder="Search by customer, invoice, or product..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 focus:bg-white transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="relative group min-w-[160px] sm:min-w-[180px]">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={16} />
              <DatePickerField
                value={dateFilter}
                onChange={setDateFilter}
                placeholder="Filter date"
                className="pl-11"
              />
            </div>

            <div className="min-w-[180px] sm:min-w-[200px]">
              <SelectField
                value={phaseFilter}
                options={[{ value: 'all', label: 'All Phases' }, ...phaseOptions]}
                onChange={setPhaseFilter}
                placeholder="Phase"
              />
            </div>

            <div className="min-w-[180px] sm:min-w-[200px]">
              <SelectField
                value={clientPaymentFilter}
                options={paymentStatusOptions}
                onChange={setClientPaymentFilter}
                placeholder="Payment status"
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
                  setEditingSale(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-sm font-bold ml-2 active:scale-95"
              >
                <Plus size={18} strokeWidth={3} />
                <span className="hidden sm:inline">Create Entry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Invoice</th>
                <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Product & Details</th>
                <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Client Name</th>
                <th className="px-3 sm:px-5 py-4 text-center text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Phase</th>
                <th className="px-3 sm:px-5 py-4 text-right text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Qty</th>
                <th className="px-3 sm:px-5 py-4 text-right text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Unit Cost</th>
                <th className="px-3 sm:px-5 py-4 text-right text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sale Price</th>
                <th className="px-3 sm:px-5 py-4 text-right text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Net Profit</th>
                <th className="px-3 sm:px-5 py-4 text-right text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Partner Profit</th>
                <th className="px-3 sm:px-5 py-4 text-center text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-5 py-4 text-right text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedSales.map((sale) => {
                const displayProfit = (sale.sell_price || 0) - (sale.buy_price || 0);

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                        #{sale.invoice_number || '---'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                      {formatDateForDisplay(sale.order_date)}
                    </td>
                    <td className="px-5 py-4 max-w-[240px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 truncate" title={sale.product_name}>{sale.product_name}</span>
                        {sale.dealer_name && <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">Dealer: {sale.dealer_name}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-700">{sale.customer_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {sale.phone_no || '---'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div className="w-[124px] mx-auto relative">
                        <select
                          value={sale.phase || 'Order Taken'}
                          onChange={(e) => handlePhaseChange(sale, e.target.value as NonNullable<Sale['phase']>)}
                          className={`phase-select appearance-none w-full rounded-full border px-2.5 pr-6 py-1 text-[10px] font-bold leading-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${getPhaseBadgeClass(sale.phase)}`}
                        >
                          {phaseOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-black text-slate-900">
                      {sale.quantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-500">
                      ₹{(sale.buy_price || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                      ₹{(sale.sell_price || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-black ${displayProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₹{displayProfit.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-left">
                      <span className="text-xs font-medium text-purple-700 max-w-[200px] block truncate" title={String(sale.profit_given || '')}>
                        {sale.profit_given ? String(sale.profit_given) : '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div className="w-[124px] mx-auto relative flex items-center justify-center">
                        {(() => {
                          const paymentStatusField = dynamicFields.find(f => f.key === 'received_through_client' && f.type === 'select');
                          const paymentStatusOptions = paymentStatusField?.options || ['Pending', 'Paid'];
                          const currentValue = sale.received_through_client || '';
                          const isPending = currentValue.toLowerCase() === 'pending' || currentValue === '';
                          
                          return (
                            <>
                              <select
                                value={isPending ? 'Pending' : currentValue}
                                onChange={(e) => handlePaymentStatusChange(sale, e.target.value)}
                                className={`phase-select appearance-none w-full rounded-full border pl-7 pr-6 py-1 text-[10px] font-bold leading-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isPending ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                              >
                                {paymentStatusOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`}></span>
                              </div>
                              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setViewingSale(sale); setShowViewModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Details"><Eye size={16} /></button>
                        <button onClick={() => handleEdit(sale)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit Entry"><Edit size={16} /></button>
                        <button
                          onClick={() => handleSendWhatsApp(sale)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                          title="Send WhatsApp Message"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                            <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.5 0 .12 5.38.12 12c0 2.1.55 4.15 1.6 5.95L0 24l6.23-1.63A11.86 11.86 0 0 0 12.1 24h.01c6.61 0 11.99-5.38 11.99-12a11.9 11.9 0 0 0-3.58-8.52Zm-8.41 18.5h-.01a9.84 9.84 0 0 1-5.01-1.37l-.36-.21-3.7.97.99-3.6-.24-.37a9.82 9.82 0 0 1-1.52-5.24c0-5.43 4.42-9.85 9.86-9.85 2.63 0 5.1 1.02 6.95 2.88a9.78 9.78 0 0 1 2.9 6.98c0 5.43-4.43 9.84-9.86 9.84Zm5.4-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15-.2.3-.76.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.24-.46-2.36-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.58-.9-2.17-.24-.57-.48-.5-.66-.51l-.56-.01c-.2 0-.52.07-.8.37-.27.3-1.03 1-1.03 2.44 0 1.43 1.05 2.82 1.2 3.02.15.2 2.07 3.16 5.01 4.43.7.3 1.26.49 1.69.63.71.23 1.35.2 1.86.12.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                          </svg>
                        </button>
                        {canDelete && (
                          <button onClick={() => setDeleteSaleId(sale.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Entry"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedSales.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="text-slate-300" size={24} />
                      </div>
                      <p className="text-slate-500 font-medium">No sales entries found matching your criteria</p>
                      <p className="text-slate-400 text-sm mt-1">
                        {sales.length === 0
                          ? 'No sales data yet. Create your first sale.'
                          : 'Try changing search or filters.'}
                      </p>
                      <button 
                        onClick={() => { setSearchTerm(''); setDateFilter(''); setClientPaymentFilter('all'); }}
                        className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination Controls */}
        {filteredSales.length > itemsPerPage && (
          <div className="bg-slate-50/50 px-4 sm:px-6 py-4 border-t border-slate-100">
            {/* Desktop Pagination */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Showing <span className="text-slate-900 font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredSales.length)}</span> of <span className="text-slate-900 font-bold">{filteredSales.length}</span> entries
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

      {/* Sale Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingSale ? 'Edit Transaction' : 'New Sale Entry'}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Fill in the details for the sales record</p>
              </div>
              <button 
                onClick={() => setShowForm(false)} 
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Invoice Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      placeholder="Enter invoice number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Radhey Invoice</label>
                    <input
                      type="text"
                      value={formData.radhey_invoice}
                      onChange={(e) => setFormData({ ...formData, radhey_invoice: e.target.value })}
                      placeholder="Enter radhey invoice"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Order Date *</label>
                    <DatePickerField
                      value={formData.order_date}
                      onChange={(value) => setFormData({ ...formData, order_date: value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Order Taken Date *</label>
                    <DatePickerField
                      value={formData.order_taken_date}
                      onChange={(value) => setFormData({ ...formData, order_taken_date: value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Order Ready Date *</label>
                    <DatePickerField
                      value={formData.order_ready_date}
                      onChange={(value) => setFormData({ ...formData, order_ready_date: value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Dispatch Date *</label>
                    <DatePickerField
                      value={formData.dispatch_date}
                      onChange={(value) => setFormData({ ...formData, dispatch_date: value })}
                    />
                  </div>
                </div>
              </div>

              {/* Product & Customer Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Product & Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      placeholder="Enter product name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Dealer Name</label>
                    <input
                      type="text"
                      value={formData.dealer_name}
                      onChange={(e) => setFormData({ ...formData, dealer_name: e.target.value })}
                      placeholder="Enter dealer name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      minLength={10}
                      maxLength={10}
                      title="Enter exactly 10 digits"
                      value={formData.phone_no}
                      onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                      placeholder="Enter 10-digit phone number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Reference</label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Enter reference"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phase *</label>
                    <SelectField
                      value={formData.phase}
                      options={phaseOptions}
                      onChange={(value) => setFormData({ ...formData, phase: value as NonNullable<Sale['phase']> })}
                      placeholder="Select phase"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Pricing & Quantity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      placeholder="Enter quantity"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Buy Price *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.buy_price}
                      onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter buy price"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Sell Price *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.sell_price}
                      onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter sell price"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Calculated Profit</label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black">
                      ₹{formData.profit.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Payment By</label>
                    {dynamicFields.find(f => f.key === 'payment_by' && f.type === 'select') ? (
                      <SelectField
                        value={formData.payment_by}
                        onChange={(value) => setFormData({ ...formData, payment_by: value })}
                        options={(dynamicFields.find(f => f.key === 'payment_by')?.options || []).map((opt) => ({ value: opt, label: opt }))}
                        placeholder="Select payment by"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.payment_by}
                        onChange={(e) => setFormData({ ...formData, payment_by: e.target.value })}
                        placeholder="Enter payment by"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Payment Through</label>
                    {dynamicFields.find(f => f.key === 'payment_through' && f.type === 'select') ? (
                      <SelectField
                        value={formData.payment_through}
                        onChange={(value) => setFormData({ ...formData, payment_through: value })}
                        options={(dynamicFields.find(f => f.key === 'payment_through')?.options || []).map((opt) => ({ value: opt, label: opt }))}
                        placeholder="Select payment through"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.payment_through}
                        onChange={(e) => setFormData({ ...formData, payment_through: e.target.value })}
                        placeholder="Enter payment through"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 ml-1">Payment Status</label>
                    {dynamicFields.find(f => f.key === 'received_through_client' && f.type === 'select') ? (
                      <SelectField
                        value={formData.received_through_client}
                        onChange={(value) => setFormData({ ...formData, received_through_client: value })}
                        options={(dynamicFields.find(f => f.key === 'received_through_client')?.options || []).map((opt) => ({ value: opt, label: opt }))}
                        placeholder="Select payment status"
                      />
                    ) : (
                      <div className="space-y-2">
                        <SelectField
                          value={formData.received_through_client.toLowerCase() === 'pending' || formData.received_through_client === '' ? 'pending' : 'received'}
                          options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'received', label: 'Paid' },
                          ]}
                          onChange={(value) => {
                            if (value === 'pending') {
                              setFormData({ ...formData, received_through_client: 'Pending' });
                            } else if (formData.received_through_client.toLowerCase() === 'pending' || formData.received_through_client === '') {
                              setFormData({ ...formData, received_through_client: 'Received' });
                            }
                          }}
                          placeholder="Select payment status"
                        />
                        <input
                          type="text"
                          placeholder="Payment details (e.g. GPay Ref)"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                          value={formData.received_through_client}
                          onChange={(e) => setFormData({ ...formData, received_through_client: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 ml-1">Profit Given</label>
                    <input
                      type="text"
                      value={formData.profit_given}
                      onChange={(e) => setFormData({ ...formData, profit_given: e.target.value })}
                      placeholder="Enter profit given details"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Additional Information</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Remarks</label>
                  <textarea
                    rows={3}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Enter any additional remarks"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {/* Custom Fields */}
              {dynamicFields.filter(f => f.enabled !== false && !formData.hasOwnProperty(f.key)).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Custom Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dynamicFields.filter(f => f.enabled !== false && !formData.hasOwnProperty(f.key)).map((field) => {
                      const fieldValue = customFieldValues[field.key] || '';
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 ml-1">
                            {field.label}{field.required ? ' *' : ''}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              required={!!field.required}
                              value={fieldValue}
                              onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder || ''}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                            />
                          ) : field.type === 'select' ? (
                            <SelectField
                              value={String(fieldValue)}
                              onChange={(value) => setCustomFieldValues((prev) => ({ ...prev, [field.key]: value }))}
                              options={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
                              placeholder={`Select ${field.label}`}
                              isClearable={!field.required}
                            />
                          ) : field.type === 'date' ? (
                            <DatePickerField
                              value={String(fieldValue)}
                              onChange={(value) => setCustomFieldValues((prev) => ({ ...prev, [field.key]: value }))}
                            />
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required={!!field.required}
                              value={fieldValue}
                              onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
                              placeholder={field.placeholder || ''}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                            />
                          ) : (
                            <input
                              type="text"
                              required={!!field.required}
                              value={fieldValue}
                              onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder || ''}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSale(null);
                  resetForm();
                }}
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-white transition-all border border-transparent hover:border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 sm:px-10 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Saving...' : (editingSale ? 'Update Record' : 'Save Transaction')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-100">
            {/* Header with solid color */}
            <div className="bg-blue-600 px-8 py-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Transaction Summary</h2>
                  <p className="text-blue-100 text-sm font-medium mt-1">#{viewingSale.invoice_number}</p>
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{(viewingSale.sell_price * viewingSale.quantity).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profit</p>
                  <p className={`text-xl font-black mt-1 ${viewingSale.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{viewingSale.profit.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phase</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getPhaseBadgeClass(viewingSale.phase)}`}>
                      {viewingSale.phase || 'Order Taken'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Highlight Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 mb-6 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Product</p>
                    <p className="text-lg font-black text-slate-900">{viewingSale.product_name}</p>
                    <p className="text-sm text-slate-600 mt-1">{viewingSale.customer_name} • {viewingSale.phone_no}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Qty × Price</p>
                    <p className="text-lg font-black text-slate-900">{viewingSale.quantity} × ₹{viewingSale.sell_price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Invoice Info */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Invoice Info
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Invoice #</span>
                      <span className="text-xs font-bold text-slate-900">{viewingSale.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Radhey Invoice</span>
                      <span className="text-xs font-bold text-slate-900">{viewingSale.radhey_invoice || 'N/A'}</span>
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
                      <span className="text-xs text-slate-500">Order Date</span>
                      <span className="text-xs font-bold text-slate-900">{formatDateForDisplay(viewingSale.order_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Ready Date</span>
                      <span className="text-xs font-bold text-slate-900">{formatDateForDisplay(viewingSale.order_ready_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Pricing
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Buy Price</span>
                      <span className="text-xs font-bold text-slate-900">₹{viewingSale.buy_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Sell Price</span>
                      <span className="text-xs font-bold text-slate-900">₹{viewingSale.sell_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-600"></span>
                    Payment
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Status</span>
                      <span className="text-xs font-bold text-slate-900">{viewingSale.received_through_client || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Method</span>
                      <span className="text-xs font-bold text-slate-900">{viewingSale.payment_through || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Additional Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Dealer</span>
                    <span className="text-xs font-bold text-slate-900">{viewingSale.dealer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Reference</span>
                    <span className="text-xs font-bold text-slate-900">{viewingSale.reference || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Payment By</span>
                    <span className="text-xs font-bold text-slate-900">{viewingSale.payment_by || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Profit Given</span>
                    <span className="text-xs font-bold text-slate-900">{viewingSale.profit_given || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {viewingSale.remarks && (
                <div className="mt-4 bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Remarks</p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">"{viewingSale.remarks}"</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created: {new Date(viewingSale.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg active:scale-95"
              >
                Close
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
                The system will automatically detect headers and import your sales data.
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
              
              <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Supported: .xlsx, .xls, .csv
              </p>
            </div>
          </div>
        </div>
      )}

      {canDelete && (
        <ConfirmDialog
          isOpen={!!deleteSaleId}
          title="Delete Sale"
          message="Are you sure you want to delete this sale?"
          confirmText="Delete"
          onCancel={() => setDeleteSaleId(null)}
          onConfirm={() => deleteSaleId && handleDelete(deleteSaleId)}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          isOpen={showClearAllConfirm}
          title="Clear All Sales"
          message="Are you sure you want to clear ALL sales data?"
          confirmText="Clear All"
          onCancel={() => setShowClearAllConfirm(false)}
          onConfirm={async () => {
            await salesAPI.deleteAll();
            setShowClearAllConfirm(false);
            fetchSales();
            showToast('All sales records cleared.', 'success');
          }}
        />
      )}
    </div>
  );
}
