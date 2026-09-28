/*
  # Migrate to Supabase Auth

  1. Changes
    - Remove username and password columns from drivers table
    - Link drivers.id directly to auth.users.id
    - Update all RLS policies to use auth.uid()
    - Remove old custom auth policies
    - Clean up sample data

  2. Security
    - Drivers authenticate via Supabase Auth only
    - drivers.id = auth.users.id for identity
    - deliveries.driver_id = auth.uid() for authorization
    - All policies now use auth.uid() instead of custom logic
*/

-- Drop old policies that used custom auth
DROP POLICY IF EXISTS "Drivers can view own profile" ON drivers;
DROP POLICY IF EXISTS "Public can read drivers for login" ON drivers;
DROP POLICY IF EXISTS "Drivers can view own deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update own deliveries" ON deliveries;
DROP POLICY IF EXISTS "Public can view all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Public can update deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can view their assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update their assigned deliveries" ON deliveries;

-- Clear existing sample data (delete in correct order due to foreign keys)
DELETE FROM delivery_proofs;
DELETE FROM deliveries;
DELETE FROM drivers;

-- Drop foreign key constraints temporarily
ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_driver_id_fkey;
ALTER TABLE delivery_proofs DROP CONSTRAINT IF EXISTS delivery_proofs_driver_id_fkey;

-- Remove username and password columns from drivers
ALTER TABLE drivers DROP COLUMN IF EXISTS username;
ALTER TABLE drivers DROP COLUMN IF EXISTS password;

-- Update drivers table primary key
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_pkey CASCADE;
ALTER TABLE drivers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE drivers ADD PRIMARY KEY (id);

-- Add foreign key to auth.users
ALTER TABLE drivers
  ADD CONSTRAINT drivers_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Recreate foreign keys from other tables to drivers
ALTER TABLE deliveries
  ADD CONSTRAINT deliveries_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES drivers(id)
  ON DELETE SET NULL;

ALTER TABLE delivery_proofs
  ADD CONSTRAINT delivery_proofs_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES drivers(id)
  ON DELETE CASCADE;

-- Create new RLS policies using auth.uid()

-- Drivers table policies
CREATE POLICY "Drivers can view own profile"
  ON drivers FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Drivers can update own profile"
  ON drivers FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Deliveries table policies
CREATE POLICY "Drivers can view assigned deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update assigned deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());
