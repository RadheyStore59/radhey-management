import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GripVertical, 
  Plus, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar,
  IndianRupee,
  TrendingUp,
  Target,
  Filter,
  ArrowUpDown,
  Search,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { Lead } from '../../types/index';
import { leadsAPI } from '../../utils/api';
import { showToast } from '../../utils/toast';

interface PipelineStage {
  id: Lead['status'];
  name: string;
  color: string;
  icon: React.ReactNode;
}

const STAGES: PipelineStage[] = [
  { id: 'New', name: 'New', color: 'bg-slate-100 border-slate-200', icon: <Target className="w-4 h-4" /> },
  { id: 'Contacted', name: 'Contacted', color: 'bg-blue-50 border-blue-200', icon: <Phone className="w-4 h-4" /> },
  { id: 'Qualified', name: 'Qualified', color: 'bg-yellow-50 border-yellow-200', icon: <Target className="w-4 h-4" /> },
  { id: 'Proposal', name: 'Proposal', color: 'bg-purple-50 border-purple-200', icon: <Mail className="w-4 h-4" /> },
  { id: 'Negotiation', name: 'Negotiation', color: 'bg-orange-50 border-orange-200', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'Won', name: 'Won', color: 'bg-green-50 border-green-200', icon: <IndianRupee className="w-4 h-4" /> },
  { id: 'Lost', name: 'Lost', color: 'bg-red-50 border-red-200', icon: <Target className="w-4 h-4" /> },
];

const PipelineBoard: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [dragOverLeadId, setDragOverLeadId] = useState<string | null>(null);
  
  // Edit Modal State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Lead>>({});
  
  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'priority' | 'custom'>('custom');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [leads, searchTerm, priorityFilter, sortBy]);

  const mapLeadFromApi = (lead: any): Lead => ({
    id: lead._id || lead.id,
    lead_name: lead.contact_name || lead.lead_name || '',
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
    product: lead.product_requirement || lead.product || '',
    contact_name: lead.contact_name || '',
    company_name: lead.company_name || '',
    product_requirement: lead.product_requirement || '',
    quantity: lead.quantity || 0,
    budget: Number(lead.budget || 0),
    budget_per_piece: Number(lead.budget_per_piece || 0),
    customization: lead.customization || '',
    pipeline_order: lead.pipeline_order || 0
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsAPI.getAll();
      setLeads((data || []).map(mapLeadFromApi));
    } catch (error) {
      console.error('Error fetching leads:', error);
      showToast('Error fetching leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...leads];

    // Search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(lead => 
        (lead.contact_name?.toLowerCase().includes(searchLower)) ||
        (lead.company_name?.toLowerCase().includes(searchLower)) ||
        (lead.product_requirement?.toLowerCase().includes(searchLower))
      );
    }

    // Priority Filter
    if (priorityFilter !== 'all') {
      result = result.filter(lead => lead.priority === priorityFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'value') {
        return (b.deal_value || 0) - (a.deal_value || 0);
      } else if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'priority') {
        const priorityMap: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
      } else if (sortBy === 'custom') {
        return (a.pipeline_order || 0) - (b.pipeline_order || 0);
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    setFilteredLeads(result);
  };

  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await leadsAPI.update(leadId, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      showToast(`Lead moved to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error moving lead', 'error');
    }
  };

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (stageId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStage(stageId);
    setDragOverLeadId(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStage(null);
    setDragOverLeadId(null);
  };

  const handleDrop = async (stageId: string, e: React.DragEvent) => {
    e.preventDefault();
    const currentDraggedLead = draggedLead;
    const currentDragOverLeadId = dragOverLeadId;
    const newStatus = stageId as Lead['status'];
    
    handleDragEnd();
    
    if (!currentDraggedLead) return;

    try {
      const stageLeads = getLeadsByStage(stageId);
      
      if (currentDraggedLead.status === stageId) {
        const draggedIdx = stageLeads.findIndex(l => l.id === currentDraggedLead.id);
        const targetIdx = stageLeads.findIndex(l => l.id === currentDragOverLeadId);
        
        if (draggedIdx === targetIdx) return;

        const updatedLeads = [...stageLeads];
        const [removed] = updatedLeads.splice(draggedIdx, 1);
        
        const newTargetIdx = currentDragOverLeadId 
          ? updatedLeads.findIndex(l => l.id === currentDragOverLeadId)
          : -1;

        if (newTargetIdx === -1) {
          updatedLeads.push(removed);
        } else {
          updatedLeads.splice(newTargetIdx, 0, removed);
        }

        const bulkUpdates = updatedLeads.map((lead, index) => ({
          id: lead.id,
          data: { 
            status: stageId,
            pipeline_order: index 
          }
        }));

        await leadsAPI.updateBulk(bulkUpdates);
      } else {
        const targetStageLeads = [...stageLeads];
        const targetIdx = currentDragOverLeadId 
          ? targetStageLeads.findIndex(l => l.id === currentDragOverLeadId)
          : -1;

        const updatedLeads = [...targetStageLeads];
        const newLead = { ...currentDraggedLead, status: newStatus };
        
        if (targetIdx === -1) {
          updatedLeads.push(newLead);
        } else {
          updatedLeads.splice(targetIdx, 0, newLead);
        }

        const bulkUpdates = updatedLeads.map((lead, index) => ({
          id: lead.id,
          data: { 
            status: newStatus,
            pipeline_order: index 
          }
        }));

        await leadsAPI.updateBulk(bulkUpdates);
      }

      showToast(`Lead ${currentDraggedLead.status === stageId ? 'reordered' : 'moved to ' + stageId}`, 'success');
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead position:', error);
      showToast('Error updating lead position', 'error');
      fetchLeads();
    }
  };

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads
      .filter(lead => lead.status === stageId)
      .sort((a, b) => (a.pipeline_order || 0) - (b.pipeline_order || 0));
  };

  const getTotalValue = (stageLeads: Lead[]) => {
    return stageLeads.reduce((sum, lead) => {
      return sum + (lead.deal_value || 0);
    }, 0);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-orange-600 bg-orange-50';
      case 'Low': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEditFormData({ ...lead });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const apiData = {
        contact_name: editFormData.contact_name,
        lead_name: editFormData.contact_name,
        company_name: editFormData.company_name,
        deal_value: editFormData.deal_value,
        priority: editFormData.priority,
        status: editFormData.status,
        expected_close_date: editFormData.expected_close_date,
        product_requirement: editFormData.product_requirement,
        product: editFormData.product_requirement,
        phone_no: editFormData.mobile_number,
        email: editFormData.email,
        lead_source: editFormData.lead_source,
        notes: editFormData.notes,
        quantity: editFormData.quantity,
        budget: editFormData.budget,
        lead_date: editFormData.date,
      };

      await leadsAPI.update(selectedLead.id, apiData);
      showToast('Lead updated successfully', 'success');
      setShowEditModal(false);
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      showToast('Error updating lead', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/leads')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
                <p className="text-sm text-slate-500">
                  {filteredLeads.length} deals • Total Pipeline: ₹{getTotalValue(leads).toLocaleString()}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 py-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search deals..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="custom">Custom Order</option>
                <option value="date">Sort by Date</option>
                <option value="value">Sort by Value</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            const totalValue = getTotalValue(stageLeads);
            const isDragOver = dragOverStage === stage.id;

            return (
              <div 
                key={stage.id}
                className={`w-72 flex-shrink-0 rounded-xl border-2 transition-all ${
                  isDragOver ? 'border-blue-400 bg-blue-50/50' : stage.color
                }`}
                onDragOver={(e) => handleDragOver(stage.id, e)}
                onDrop={(e) => handleDrop(stage.id, e)}
                onDragLeave={() => {
                  setDragOverStage(null);
                  setDragOverLeadId(null);
                }}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        stage.id === 'New' ? 'bg-slate-100' :
                        stage.id === 'Contacted' ? 'bg-blue-100' :
                        stage.id === 'Qualified' ? 'bg-yellow-100' :
                        stage.id === 'Proposal' ? 'bg-purple-100' :
                        stage.id === 'Negotiation' ? 'bg-orange-100' :
                        stage.id === 'Won' ? 'bg-green-100' :
                        'bg-red-100'
                      }`}>
                        {stage.icon}
                      </div>
                      <span className="font-semibold text-slate-700">{stage.name}</span>
                    </div>
                    <span className="px-2 py-1 bg-white rounded-md text-xs font-medium text-slate-500">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    Value: ₹{totalValue.toLocaleString()}
                  </div>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-3 min-h-[200px]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverLeadId(lead.id);
                      }}
                      onClick={() => handleCardClick(lead)}
                      className={`bg-white rounded-lg p-3 shadow-sm border cursor-move hover:shadow-md transition-all group relative ${
                        dragOverLeadId === lead.id ? 'border-t-4 border-t-blue-500 mt-[-4px]' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate text-sm">
                              {lead.contact_name}
                            </h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getPriorityColor(lead.priority)}`}>
                              {lead.priority}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 truncate mb-2">
                            {lead.company_name || lead.product_requirement || '---'}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                              <IndianRupee className="w-3 h-3 text-slate-400" />
                              ₹{(lead.deal_value || 0).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {new Date(lead.date).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {lead.expected_close_date && (
                            <div className="mt-2 text-[10px] flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-1 rounded">
                              <Target className="w-3 h-3" />
                              Exp: {new Date(lead.expected_close_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Lead Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Edit Deal Details</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.contact_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.mobile_number || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile_number: e.target.value })}
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company / Requirement</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.company_name || editFormData.product_requirement || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deal Value (₹)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.deal_value || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, deal_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.priority || 'Medium'}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as any })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.status || 'New'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Exp. Close Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.expected_close_date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, expected_close_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editFormData.date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineBoard;
