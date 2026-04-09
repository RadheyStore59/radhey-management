// Temporary localStorage-based data management for testing without Supabase
import { Lead, Sale, Inventory, DashboardStats } from '../types';

const STORAGE_KEYS = {
  LEADS: 'radhey_leads',
  SALES: 'radhey_sales', 
  INVENTORY: 'radhey_inventory',
  USERS: 'radhey_users',
  CURRENT_USER: 'radhey_current_user',
  WHATSAPP_TEMPLATES: 'radhey_whatsapp_templates',
};

export class LocalStorageDB {
  // Leads
  static getLeads(): Lead[] {
    const data = localStorage.getItem(STORAGE_KEYS.LEADS);
    return data ? JSON.parse(data) : [];
  }

  static saveLeads(leads: Lead[]): void {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }

  static addLead(lead: any): void {
    const leads = this.getLeads();
    const newLead = { ...lead, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    leads.push(newLead);
    this.saveLeads(leads);
  }

  static updateLead(id: string, updates: Partial<Lead>): void {
    const leads = this.getLeads();
    const index = leads.findIndex(lead => lead.id === id);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...updates };
      this.saveLeads(leads);
    }
  }

  static deleteLead(id: string): void {
    const leads = this.getLeads();
    const filtered = leads.filter((lead: any) => lead.id !== id);
    this.saveLeads(filtered);
  }

  // Sales
  static getSales(): Sale[] {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    return data ? JSON.parse(data) : [];
  }

  static saveSales(sales: Sale[]): void {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  static addSale(sale: any): void {
    const sales = this.getSales();
    const newSale = { ...sale, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    sales.push(newSale);
    this.saveSales(sales);
  }

  static updateSale(id: string, updates: Partial<Sale>): void {
    const sales = this.getSales();
    const index = sales.findIndex(sale => sale.id === id);
    if (index !== -1) {
      sales[index] = { ...sales[index], ...updates };
      this.saveSales(sales);
    }
  }

  static deleteSale(id: string): void {
    const sales = this.getSales();
    const filtered = sales.filter(sale => sale.id !== id);
    this.saveSales(filtered);
  }

  // Inventory
  static getInventory(): Inventory[] {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  }

  static saveInventory(inventory: Inventory[]): void {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }

  static addInventoryItem(item: any): void {
    const inventory = this.getInventory();
    const newItem = { ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    inventory.push(newItem);
    this.saveInventory(inventory);
  }

  static updateInventoryItem(id: string, updates: Partial<Inventory>): void {
    const inventory = this.getInventory();
    const index = inventory.findIndex(item => item.id === id);
    if (index !== -1) {
      inventory[index] = { ...inventory[index], ...updates };
      this.saveInventory(inventory);
    }
  }

  static deleteInventoryItem(id: string): void {
    const inventory = this.getInventory();
    const filtered = inventory.filter(item => item.id !== id);
    this.saveInventory(filtered);
  }

  // Auth
  static getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  static setCurrentUser(user: any): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Users
  static getUsers(): any[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  static saveUsers(users: any[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Dashboard Stats
  static getDashboardStats(): DashboardStats {
    const leads = this.getLeads();
    const sales = this.getSales();
    const inventory = this.getInventory();
    
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.sell_price || 0), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const lowStockItems = inventory.filter(item => item.stock_quantity <= item.minimum_stock_level).length;
    
    return {
      totalLeads: leads.length,
      totalSales: sales.length,
      totalRevenue,
      totalProfit,
      totalInventoryItems: inventory.length,
      lowStockItems,
      totalQuantity: sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0),
      totalInvestmentAmount: 0, // Add logic if needed
      activeLeads: leads.filter(lead => lead.status === 'New' || lead.status === 'Contacted').length
    };
  }

  static getWhatsAppTemplates() {
    const templates = localStorage.getItem(STORAGE_KEYS.WHATSAPP_TEMPLATES);
    return templates ? JSON.parse(templates) : {
      leads: '',
      sales: '',
      default: ''
    };
  }

  static saveWhatsAppTemplates(templates: any): void {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_TEMPLATES, JSON.stringify(templates));
  }

  static addUser(user: any): void {
    const users = this.getUsers();
    const newUser = { ...user, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    users.push(newUser);
    this.saveUsers(users);
  }

  static updateUser(id: string, updates: Partial<any>): void {
    const users = this.getUsers();
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);
    }
  }

  static deleteUser(id: string): void {
    const users = this.getUsers();
    const filtered = users.filter(user => user.id !== id);
    this.saveUsers(filtered);
  }

  static getInvestments(): any[] {
    const data = localStorage.getItem('radhey_investments');
    return data ? JSON.parse(data) : [];
  }

  static saveInvestments(investments: any[]): void {
    localStorage.setItem('radhey_investments', JSON.stringify(investments));
  }

  static getToken(): string | null {
    return localStorage.getItem('radhey_auth_token');
  }

  static setToken(token: string): void {
    localStorage.setItem('radhey_auth_token', token);
  }

  static clearToken(): void {
    localStorage.removeItem('radhey_auth_token');
  }
}
