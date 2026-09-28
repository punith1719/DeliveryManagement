/*
  # Add Admin Policies for Driver Management

  1. Changes
    - Add INSERT policy for admins to create drivers
    - Add SELECT policy for admins to view all drivers
    - Add UPDATE policy for admins to manage drivers

  2. Security
    - Only authenticated admins can create, view, and update drivers
    - Policies check admin status via admins table
*/

-- Allow admins to create drivers
CREATE POLICY "Admins can create drivers"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Allow admins to view all drivers
CREATE POLICY "Admins can view all drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Allow admins to update all drivers
CREATE POLICY "Admins can update drivers"
  ON drivers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );
