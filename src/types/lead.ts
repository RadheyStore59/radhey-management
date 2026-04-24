export interface Lead {
  id: string;
  lead_date: string;
  contact_name: string;
  company_name: string;
  lead_source: string;
  product_requirement: string;
  quantity: number;
  budget?: number;
  budget_per_piece: number;
  customization: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  priority: 'Low' | 'Medium' | 'High';
  deal_value?: number;
  expected_close_date?: string;
  pipeline_order?: number;
  last_follow_up: string;
  next_action: string;
  notes: string;
  phone_no?: string;
  email?: string;
  created_at: string;
}

export interface LeadFormData {
  lead_date: string;
  contact_name: string;
  company_name: string;
  lead_source: string;
  product_requirement: string;
  quantity: number;
  budget: string;
  budget_per_piece: number;
  customization: string;
  status: Lead['status'];
  priority: Lead['priority'];
  deal_value?: number;
  expected_close_date?: string;
  last_follow_up: string;
  next_action: string;
  notes: string;
  phone_no?: string;
  email?: string;
}
