-- Radhey Management System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT,
  lead_source VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')),
  priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  deal_value DECIMAL(12,2) DEFAULT 0,
  expected_close_date DATE,
  notes TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL GENERATED ALWAYS AS (quantity * rate) STORED,
  payment_mode VARCHAR(20) DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Bank')),
  sales_date DATE NOT NULL,
  sales_person VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER NOT NULL DEFAULT 5,
  supplier_name VARCHAR(255),
  last_updated_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create users table for additional user management
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'Staff' CHECK (role IN ('Admin', 'Staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for leads table
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for sales table
CREATE POLICY "Users can view their own sales" ON sales
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales" ON sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" ON sales
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" ON sales
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for inventory table
CREATE POLICY "Users can view their own inventory" ON inventory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory" ON inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory" ON inventory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory" ON inventory
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for users table (only admins can manage users)
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_date ON leads(date);

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sales_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);

CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_code ON inventory(product_code);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create function to automatically set user_id for leads
CREATE OR REPLACE FUNCTION set_lead_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id for leads
CREATE TRIGGER set_lead_user_id_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_lead_user_id();

-- Create function to automatically set user_id for sales
CREATE OR REPLACE FUNCTION set_sales_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id for sales
CREATE TRIGGER set_sales_user_id_trigger
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION set_sales_user_id();

-- Create function to automatically set user_id for inventory
CREATE OR REPLACE FUNCTION set_inventory_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id for inventory
CREATE TRIGGER set_inventory_user_id_trigger
  BEFORE INSERT ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION set_inventory_user_id();

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'Staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default admin user (you need to create this user through Supabase Auth first)
-- This will be executed when the admin user signs up for the first time
-- The trigger above will automatically create the user profile

-- Create sample data (optional - uncomment for testing)
/*
INSERT INTO inventory (product_name, product_code, category, purchase_price, selling_price, stock_quantity, minimum_stock_level, supplier_name, user_id) VALUES
('Sample Product 1', 'PROD001', 'Electronics', 50.00, 75.00, 100, 10, 'ABC Supplier', auth.uid()),
('Sample Product 2', 'PROD002', 'Accessories', 20.00, 35.00, 50, 5, 'XYZ Supplier', auth.uid());
*/

-- Grant necessary permissions
GRANT ALL ON leads TO authenticated;
GRANT ALL ON sales TO authenticated;
GRANT ALL ON inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT ALL ON users TO authenticated; -- This will be restricted by RLS policies

-- Create view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM leads) as total_leads,
  (SELECT COUNT(*) FROM sales) as total_sales,
  (SELECT COALESCE(SUM(total_amount), 0) FROM sales) as total_revenue,
  (SELECT COUNT(*) FROM inventory) as total_inventory_items,
  (SELECT COUNT(*) FROM inventory WHERE stock_quantity <= minimum_stock_level) as low_stock_items;

-- Grant access to dashboard stats view
GRANT SELECT ON dashboard_stats TO authenticated;
