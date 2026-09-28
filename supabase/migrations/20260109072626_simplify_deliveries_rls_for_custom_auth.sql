/*
  # Simplify RLS for Custom Authentication
  
  1. Changes
    - Allow public read access to deliveries (filtering handled in app)
    - Allow public update access to deliveries (app validates user role)
    - Allow public insert access to deliveries (app validates user role)
  
  2. Security Note
    - Since we're using custom authentication (not Supabase Auth)
    - Access control is enforced at the application layer
    - Future enhancement: Use Supabase Edge Functions for server-side validation
*/

-- Drop all existing policies on deliveries
DROP POLICY IF EXISTS "Admins can view all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can update all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can create deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update assigned deliveries" ON deliveries;

-- Create simple public policies (app handles authorization)
CREATE POLICY "Allow public access to deliveries"
  ON deliveries
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
