import React, { useState, useMemo } from 'react';
import { Lead } from '../types/lead';

interface LeadTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusUpdate: (id: string, status: Lead['status']) => void;
}

export default function LeadTable({ leads, onEdit, onDelete, onStatusUpdate }: LeadTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const statusOptions: Lead['status'][] = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost'
  ];

  const sources = useMemo(() => {
    const uniqueSources = Array.from(new Set(leads.map(lead => lead.lead_source)));
    return uniqueSources;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchTerm === '' || 
        lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.lead_source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter]);

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

  const isFollowUpDue = (lastFollowUp: string) => {
    if (!lastFollowUp) return false;
    const followUpDate = new Date(lastFollowUp);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return followUpDate <= twoDaysAgo;
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const exportToCSV = () => {
    const headers = [
      'Lead Date', 'Contact Name', 'Company', 'Source', 'Requirement',
      'Quantity', 'Budget', 'Customization', 'Status', 'Last Follow Up',
      'Next Action', 'Notes'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        lead.lead_date,
        lead.contact_name,
        lead.company_name,
        lead.lead_source,
        lead.product_requirement,
        lead.quantity,
        lead.budget,
        lead.customization,
        lead.status,
        lead.last_follow_up,
        lead.next_action,
        lead.notes
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name or company..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Lead['status'] | 'all')}
          >
            <option value="all">All Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requirement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget Per Piece
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value (₹)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Follow-up
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.lead_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {lead.contact_name}
                    {isFollowUpDue(lead.last_follow_up) && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Follow-up Due
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.company_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.lead_source}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate">{lead.product_requirement}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.budget ? `₹${lead.budget}` : '---'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  ₹{(lead.deal_value || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lead.priority === 'High' ? 'bg-red-100 text-red-800' :
                    lead.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {lead.priority || 'Medium'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-indigo-500 ${getStatusColor(lead.status)}`}
                    value={lead.status}
                    onChange={(e) => onStatusUpdate(lead.id, e.target.value as Lead['status'])}
                  >
                    {statusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.last_follow_up}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(lead)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(lead.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => openWhatsApp(lead.contact_name)}
                      className="text-green-600 hover:text-green-900"
                      title="WhatsApp"
                    >
                      WA
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No leads found matching your criteria.
        </div>
      )}
    </div>
  );
}
