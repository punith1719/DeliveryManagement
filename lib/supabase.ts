import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jzghbspmllbaqrdepgeg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Z2hic3BtbGxiYXFyZGVwZ2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTEyMTYsImV4cCI6MjA4MDQ4NzIxNn0.Yx3XJ6twGoKKGOtBBHvXWFpf8IZRGH7KyaUPuKMzQ64";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Driver = {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  role: 'DRIVER' | 'ADMIN';
  created_at: string;
};

export type Delivery = {
  id: string;
  driver_id: string | null;
  salesid: string;
  customer_name: string;
  delivery_address: string;
  product_details: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  created_at: string;
  updated_at: string;
  latitude: number | null;
  longitude: number | null;
};
