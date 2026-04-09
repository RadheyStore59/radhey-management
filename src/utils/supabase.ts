import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_URL !== 'your_supabase_url_here' 
  ? process.env.REACT_APP_SUPABASE_URL 
  : 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY && process.env.REACT_APP_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here'
  ? process.env.REACT_APP_SUPABASE_ANON_KEY 
  : 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
