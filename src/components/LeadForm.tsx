import React, { useState, useEffect } from 'react';
import { Lead, LeadFormData } from '../types/lead';
import { supabase } from '../utils/supabase';

interface LeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
  onSave: () => void;
}

export default function LeadForm({ lead, onClose, onSave }: LeadFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    lead_date: '',
    contact_name: '',
    company_name: '',
    lead_source: '',
    product_requirement: '',
    quantity: 1,
    budget: '',
    budget_per_piece: 0,
    customization: '',
    status: 'New',
    priority: 'Medium',
    deal_value: 0,
    expected_close_date: '',
    last_follow_up: '',
    next_action: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions: Lead['status'][] = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost'
  ];

  const sourceOptions = [
    'IndiaMART',
    'WhatsApp',
    'LinkedIn',
    'Direct Inquiry',
    'Referral',
    'Email',
    'Phone',
    'Website',
    'Other'
  ];

  useEffect(() => {
    if (lead) {
      setFormData({
        lead_date: lead.lead_date,
        contact_name: lead.contact_name,
        company_name: lead.company_name,
        lead_source: lead.lead_source,
        product_requirement: lead.product_requirement,
        quantity: lead.quantity,
        budget: String(lead.budget ?? ''),
        budget_per_piece: Number(lead.budget_per_piece || 0),
        customization: lead.customization,
        status: lead.status,
        priority: lead.priority || 'Medium',
        deal_value: lead.deal_value || 0,
        expected_close_date: lead.expected_close_date || '',
        last_follow_up: lead.last_follow_up,
        next_action: lead.next_action,
        notes: lead.notes
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, lead_date: today }));
    }
  }, [lead]);

  // Auto-calculate budget per piece when quantity or total budget changes
  useEffect(() => {
    const quantity = parseFloat(String(formData.quantity)) || 0;
    const budget = parseFloat(formData.budget) || 0;
    
    if (quantity > 0 && budget > 0) {
      const perPiece = Number((budget / quantity).toFixed(2));
      setFormData(prev => ({ ...prev, budget_per_piece: perPiece }));
    }
  }, [formData.quantity, formData.budget]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (lead) {
        const { error } = await supabase
          .from('leads')
          .update(formData)
          .eq('id', lead.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([formData]);

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h3>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead Date *</label>
                <input
                  type="date"
                  name="lead_date"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.lead_date}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name *</label>
                <input
                  type="text"
                  name="contact_name"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.contact_name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.company_name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Lead Source *</label>
                <select
                  name="lead_source"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.lead_source}
                  onChange={handleChange}
                >
                  <option value="">Select Source</option>
                  {sourceOptions.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Budget Per Piece (₹)</label>
                <input
                  type="text"
                  name="budget"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.budget}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  name="priority"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Deal Value (₹)</label>
                <input
                  type="number"
                  name="deal_value"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.deal_value}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Exp. Close Date</label>
                <input
                  type="date"
                  name="expected_close_date"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.expected_close_date}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Follow-up</label>
                <input
                  type="date"
                  name="last_follow_up"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.last_follow_up}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Product Requirement *</label>
              <textarea
                name="product_requirement"
                required
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.product_requirement}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customization</label>
              <textarea
                name="customization"
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.customization}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Next Action</label>
              <input
                type="text"
                name="next_action"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.next_action}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (lead ? 'Update' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
