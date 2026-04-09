export interface Lead {
  id: string;
  lead_date: string;
  contact_name: string;
  company_name: string;
  lead_source: string;
  product_requirement: string;
  quantity: number;
  budget: string;
  customization: string;
  status: 'New Lead' | 'Contacted' | 'Interested' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  last_follow_up: string;
  next_action: string;
  notes: string;
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
  customization: string;
  status: Lead['status'];
  last_follow_up: string;
  next_action: string;
  notes: string;
}
