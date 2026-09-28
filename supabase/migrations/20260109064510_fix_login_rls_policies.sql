/*
  # Fix Login RLS Policies
  
  1. Changes
    - Drop all existing SELECT policies on drivers table
    - Create a single simple policy allowing public read access for login
    - This allows unauthenticated users to query username, password, and role for authentication
  
  2. Security
    - Public can read all driver records (needed for login without Supabase Auth)
    - Other operations (INSERT, UPDATE, DELETE) remain protected by existing policies
*/

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Allow public to read drivers for login" ON drivers;
DROP POLICY IF EXISTS "Drivers can view own profile" ON drivers;
DROP POLICY IF EXISTS "Admins can view all drivers" ON drivers;

-- Create a single simple policy for public read access
CREATE POLICY "Public can read drivers for authentication"
  ON drivers
  FOR SELECT
  TO anon, authenticated
  USING (true);
