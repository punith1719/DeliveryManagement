/*
  # Fix Admin Role-Based Access
  
  1. Changes
    - Drop old admin policies that check the admins table
    - Create new policies that check the role column in drivers table
    - Admins (role='ADMIN') can view and manage all deliveries
    - Regular drivers (role='DRIVER') can only view their assigned deliveries
  
  2. Security
    - Admins have full access to deliveries
    - Drivers can only see deliveries assigned to them
    - Public policies removed for security
*/

-- Drop all existing policies on deliveries
DROP POLICY IF EXISTS "Admins can view all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can update all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can create deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Allow public to view deliveries" ON deliveries;
DROP POLICY IF EXISTS "Allow public to update deliveries" ON deliveries;

-- Create new role-based policies for SELECT
CREATE POLICY "Admins can view all deliveries"
  ON deliveries
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.username = current_setting('app.current_user', true)
      AND drivers.role = 'ADMIN'
    )
  );

CREATE POLICY "Drivers can view assigned deliveries"
  ON deliveries
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.username = current_setting('app.current_user', true)
      AND drivers.role = 'DRIVER'
      AND drivers.id = deliveries.driver_id
    )
  );

-- Create new role-based policies for UPDATE
CREATE POLICY "Admins can update all deliveries"
  ON deliveries
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.username = current_setting('app.current_user', true)
      AND drivers.role = 'ADMIN'
    )
  );

CREATE POLICY "Drivers can update assigned deliveries"
  ON deliveries
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.username = current_setting('app.current_user', true)
      AND drivers.role = 'DRIVER'
      AND drivers.id = deliveries.driver_id
    )
  );

-- Create new role-based policy for INSERT
CREATE POLICY "Admins can create deliveries"
  ON deliveries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.username = current_setting('app.current_user', true)
      AND drivers.role = 'ADMIN'
    )
  );
