import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Download, Upload, AlertTriangle, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Eye, ChevronDown } from 'lucide-react';
import { Lead } from '../types';
import { leadsAPI, formConfigAPI } from '../utils/api';
import * as XLSX from 'xlsx';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import DynamicFields from './DynamicFields';
import { DynamicFormField } from '../types/formConfig';
import { showToast } from '../utils/toast';
import SkeletonLoader, { TableSkeleton, StatsCardSkeleton } from './SkeletonLoader';
import { isValidPhone10, isValidEmail } from '../utils/validation';
import { Phone, Mail, Tag, AlertCircle, FileText, CheckCircle, Calendar, Edit2 } from 'lucide-react';
import DatePickerField from './DatePickerField';
import SelectField from './SelectField';
import { openWhatsAppWithTemplate } from '../utils/whatsapp';

export default function LeadsManagement() {
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [dynamicFields, setDynamicFields] = useState<DynamicFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    lead_name: '',
    product: '',
    mobile_number: '',
    email: '',
    lead_source: '',
    status: 'New' as Lead['status'],
    priority: 'Medium' as Lead['priority'],
    deal_value: 0,
    expected_close_date: new Date().toISOString().split('T')[0],
    notes: '',
    date: new Date().toISOString().split('T')[0],
    quantity: 0,
    budget_per_piece: '',
  });

  const leadSources = [
    'Website', 'Phone', 'Email', 'Referral', 'Social Media', 'Advertisement', 'Other'
  ];
  const leadSourceField = dynamicFields.find((f) => f.key === 'lead_source');
  const leadSourceOptions = (leadSourceField?.options && leadSourceField.options.length > 0)
    ? leadSourceField.options
    : leadSources;
  const coreFieldKeys = new Set(['lead_name', 'product', 'mobile_number', 'email', 'lead_source', 'status', 'date', 'notes']);
  const extraDynamicFields = dynamicFields.filter((f) => !coreFieldKeys.has(f.key));

  const statusOptions: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const priorityOptions: Lead['priority'][] = ['Low', 'Medium', 'High'];
  const statusSelectOptions = statusOptions.map((status) => ({ value: status, label: status }));
  const prioritySelectOptions = priorityOptions.map((priority) => ({ value: priority, label: priority }));
  const leadSourceSelectOptions = leadSourceOptions.map((source) => ({ value: source, label: source }));

  useEffect(() => {
    fetchLeads();
    fetchDynamicFields();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const mapLeadFromApi = (lead: any): Lead => ({
    id: lead._id || lead.id,
    lead_name: lead.contact_name || lead.lead_name || '',
    product: lead.product_requirement || lead.product || '',
    mobile_number: lead.phone_no || lead.mobile_number || '',
    email: lead.email || '',
    address: lead.address || '',
    lead_source: lead.lead_source || '',
    status: lead.status || 'New',
    priority: lead.priority || 'Medium',
    deal_value: lead.deal_value || 0,
    expected_close_date: lead.expected_close_date || '',
    notes: lead.notes || '',
    date: lead.lead_date || lead.date || new Date().toISOString().split('T')[0],
    created_at: lead.created_at || new Date().toISOString(),
    user_id: lead.user_id || 'current-user',
    custom_fields: lead.custom_fields || {},
    contact_name: lead.contact_name || '',
    company_name: lead.company_name || '',
    product_requirement: lead.product_requirement || '',
    quantity: lead.quantity || 0,
    budget_per_piece: lead.budget_per_piece || lead.budget || '',
    customization: lead.customization || '',
    pipeline_order: lead.pipeline_order || 0
  });

  const mapLeadToApi = (lead: typeof formData) => ({
    lead_date: lead.date,
    contact_name: lead.lead_name,
    product_requirement: lead.product,
    phone_no: lead.mobile_number,
    email: lead.email,
    lead_source: lead.lead_source,
    status: lead.status,
    priority: lead.priority,
    deal_value: lead.deal_value,
    expected_close_date: lead.expected_close_date,
    notes: lead.notes,
    quantity: Number(lead.quantity) || 0,
    budget_per_piece: Number(lead.budget_per_piece) || 0,
    customization: (lead as any).customization,
    pipeline_order: (lead as any).pipeline_order || 0,
    custom_fields: customFieldValues,
  });

  const fetchDynamicFields = async () => {
    try {
      const data = await formConfigAPI.getByModule('leads');
      setDynamicFields((data?.fields || []).filter((f: DynamicFormField) => f.enabled !== false));
    } catch (error) {
      console.error('Error fetching lead form config:', error);
      setDynamicFields([]);
    }
  };

  const fetchLeads = async () => {
    try {
      const data = await leadsAPI.getAll();
      setLeads((data || []).map(mapLeadFromApi));
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.mobile_number.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if mobile_number is required in dynamic form config
      const phoneField = dynamicFields.find(f => f.key === 'mobile_number');
      if (phoneField?.required && !isValidPhone10(formData.mobile_number)) {
        showToast('Mobile number must be exactly 10 digits.', 'error');
        return;
      }
      // Check if email is required in dynamic form config
      const emailField = dynamicFields.find(f => f.key === 'email');
      if (emailField?.required && !isValidEmail(formData.email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      console.log('Saving lead data:', formData);
      if (editingLead) {
        await leadsAPI.update(editingLead.id, mapLeadToApi(formData));
        console.log('Lead updated successfully');
        showToast('Lead updated successfully.', 'success');
      } else {
        await leadsAPI.create(mapLeadToApi(formData));
        console.log('Lead added successfully');
        showToast('Lead added successfully.', 'success');
      }

      setShowForm(false);
      setEditingLead(null);
      resetForm();
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      showToast('Error saving lead.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      lead_name: lead.lead_name,
      product: lead.product || '',
      mobile_number: lead.mobile_number,
      email: lead.email,
      lead_source: lead.lead_source,
      status: lead.status,
      priority: lead.priority || 'Medium',
      deal_value: lead.deal_value || 0,
      expected_close_date: lead.expected_close_date || new Date().toISOString().split('T')[0],
      notes: lead.notes,
    date: lead.date,
    quantity: lead.quantity || 0,
    budget_per_piece: String(lead.budget_per_piece ?? lead.budget ?? ''),
  });
    setCustomFieldValues((lead as any).custom_fields || {});
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    try {
      await leadsAPI.delete(id);
      await fetchLeads();
      showToast('Lead deleted successfully.', 'success');
    } catch (error) {
      console.error('Error deleting lead:', error);
      showToast('Error deleting lead.', 'error');
    } finally {
      setDeleteLeadId(null);
    }
  };

  const convertToSale = async (lead: Lead) => {
    // Navigate to sales page with pre-filled data
    console.log('Converting lead to sale:', lead);
    // This would typically navigate to sales page with lead data
  };

  const handleSendWhatsApp = (lead: Lead) => {
    const opened = openWhatsAppWithTemplate({
      module: 'leads',
      customerName: lead.lead_name,
      phone: lead.mobile_number,
      orderId: lead.id,
    });
    if (!opened) {
      showToast('Invalid phone number for WhatsApp.', 'error');
    }
  };

  const handleStatusChange = async (lead: Lead, status: Lead['status']) => {
    try {
      await leadsAPI.update(lead.id, { status });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
      showToast('Status updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error updating status.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      lead_name: '',
      product: '',
      mobile_number: '',
      email: '',
      lead_source: '',
      status: 'New',
      priority: 'Medium',
      deal_value: 0,
      expected_close_date: new Date().toISOString().split('T')[0],
      notes: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 0,
      budget_per_piece: '',
    });
    setCustomFieldValues({});
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'bg-slate-100 text-slate-800';
      case 'Contacted': return 'bg-blue-100 text-blue-800';
      case 'Qualified': return 'bg-yellow-100 text-yellow-800';
      case 'Proposal': return 'bg-purple-100 text-purple-800';
      case 'Negotiation': return 'bg-orange-100 text-orange-800';
      case 'Won': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && leads.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
        <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <SkeletonLoader height="h-10 sm:h-12" width="w-40 sm:w-48" className="mb-2 sm:mb-3" />
            <SkeletonLoader height="h-5 sm:h-6" width="w-56 sm:w-64" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <SkeletonLoader height="h-10" />
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <SkeletonLoader height="h-10" width="w-32 sm:w-40" />
              <SkeletonLoader height="h-10" width="w-40 sm:w-48" />
            </div>
          </div>
        </div>

        <TableSkeleton rows={5} columns={7} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-tight sm:leading-normal">Leads Management</h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">Manage and track your business leads</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Total Leads</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">{filteredLeads.length}</span>
          </div>
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-end relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest relative z-10">Active Leads</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 relative z-10 break-words overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">{filteredLeads.filter(lead => ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation'].includes(lead.status)).length}</span>
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
              placeholder="Search by customer, product, email, or phone..."
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
                onClick={() => {
                  setShowForm(true);
                  setEditingLead(null);
                  resetForm();
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-sm font-bold active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Lead</span>
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Budget Per Piece</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{lead.lead_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {lead.product || '---'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {lead.budget_per_piece ? `₹${lead.budget_per_piece}` : '---'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {lead.mobile_number}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4 text-slate-400" />
                        {lead.lead_source}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="w-[124px] mx-auto relative flex items-center justify-center">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as Lead['status'])}
                          className={`phase-select appearance-none w-full rounded-full border pl-7 pr-6 py-1 text-[10px] font-bold leading-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${getStatusColor(lead.status)}`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {lead.status === 'New' && <AlertCircle className="w-3 h-3" />}
                          {lead.status === 'Contacted' && <FileText className="w-3 h-3" />}
                          {lead.status === 'Qualified' && <Tag className="w-3 h-3" />}
                          {lead.status === 'Proposal' && <FileText className="w-3 h-3" />}
                          {lead.status === 'Negotiation' && <TrendingUp className="w-3 h-3" />}
                          {lead.status === 'Won' && <CheckCircle className="w-3 h-3" />}
                          {lead.status === 'Lost' && <AlertTriangle className="w-3 h-3" />}
                        </div>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(lead.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendWhatsApp(lead)}
                          className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded-lg transition-colors"
                          title="Send WhatsApp Message"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                            <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.5 0 .12 5.38.12 12c0 2.1.55 4.15 1.6 5.95L0 24l6.23-1.63A11.86 11.86 0 0 0 12.1 24h.01c6.61 0 11.99-5.38 11.99-12a11.9 11.9 0 0 0-3.58-8.52Zm-8.41 18.5h-.01a9.84 9.84 0 0 1-5.01-1.37l-.36-.21-3.7.97.99-3.6-.24-.37a9.82 9.82 0 0 1-1.52-5.24c0-5.43 4.42-9.85 9.86-9.85 2.63 0 5.1 1.02 6.95 2.88a9.78 9.78 0 0 1 2.9 6.98c0 5.43-4.43 9.84-9.86 9.84Zm5.4-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15-.2.3-.76.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.24-.46-2.36-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.58-.9-2.17-.24-.57-.48-.5-.66-.51l-.56-.01c-.2 0-.52.07-.8.37-.27.3-1.03 1-1.03 2.44 0 1.43 1.05 2.82 1.2 3.02.15.2 2.07 3.16 5.01 4.43.7.3 1.26.49 1.69.63.71.23 1.35.2 1.86.12.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                          </svg>
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteLeadId(lead.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {lead.status === 'Contacted' && (
                          <button
                            onClick={() => convertToSale(lead)}
                            className="text-green-600 hover:text-green-900 text-xs bg-green-100 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Convert
                          </button>
                        )}
                      </div>
                    </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="text-slate-300" size={24} />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {leads.length === 0
                          ? 'No leads yet. Add your first lead to get started.'
                          : 'No leads found matching your criteria'}
                      </p>
                      {leads.length === 0 ? (
                        <button
                          onClick={() => {
                            setShowForm(true);
                            setEditingLead(null);
                            resetForm();
                          }}
                          className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                        >
                          Add first lead
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

      {/* Lead Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h2>
            </div>
            
            <form id="lead-form" onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.lead_name}
                    onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Product *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number {dynamicFields.find(f => f.key === 'mobile_number')?.required && '*'}
                  </label>
                  <input
                    type="tel"
                    required={dynamicFields.find(f => f.key === 'mobile_number')?.required}
                    pattern="[0-9]{10}"
                    minLength={10}
                    maxLength={10}
                    title="Enter exactly 10 digits"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email {dynamicFields.find(f => f.key === 'email')?.required && '*'}
                  </label>
                  <input
                    type="email"
                    required={dynamicFields.find(f => f.key === 'email')?.required}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lead Source *
                  </label>
                  <SelectField
                    value={formData.lead_source}
                    options={leadSourceSelectOptions}
                    onChange={(value) => setFormData({ ...formData, lead_source: value })}
                    placeholder="Select Source"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <SelectField
                    value={formData.status}
                    options={statusSelectOptions}
                    onChange={(value) => setFormData({ ...formData, status: value as Lead['status'] })}
                    placeholder="Status"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date
                  </label>
                  <DatePickerField
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Budget Per Piece (₹)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.budget_per_piece}
                    onChange={(e) => setFormData({ ...formData, budget_per_piece: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority
                  </label>
                  <SelectField
                    value={formData.priority}
                    options={prioritySelectOptions}
                    onChange={(value) => setFormData({ ...formData, priority: value as Lead['priority'] })}
                    placeholder="Priority"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Deal Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.deal_value}
                    onChange={(e) => setFormData({ ...formData, deal_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Expected Close Date
                  </label>
                  <DatePickerField
                    value={formData.expected_close_date || ''}
                    onChange={(value) => setFormData({ ...formData, expected_close_date: value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

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
                  setEditingLead(null);
                  resetForm();
                }}
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-white transition-all border border-transparent hover:border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="lead-form"
                disabled={loading}
                className="px-6 sm:px-10 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingLead ? 'Update' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {canDelete && (
        <ConfirmDialog
          isOpen={!!deleteLeadId}
          title="Delete Lead"
          message="Are you sure you want to delete this lead?"
          confirmText="Delete"
          onCancel={() => setDeleteLeadId(null)}
          onConfirm={() => deleteLeadId && handleDelete(deleteLeadId)}
        />
      )}
    </div>
  );
}
