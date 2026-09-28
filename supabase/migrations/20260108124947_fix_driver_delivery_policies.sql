/*
  # Fix Driver Delivery Policies

  This migration fixes the RLS policies for drivers to properly use auth.uid() instead of custom session variables.

  1. Changes
    - Drop old driver policies that used custom session variables
    - Create new policies using auth.uid() for proper authentication
    - Drivers can now view and update deliveries where driver_id matches their user ID

  2. Security
    - Drivers can only view deliveries assigned to them (driver_id = auth.uid())
    - Drivers can only update deliveries assigned to them
    - Admins retain full access to all deliveries
*/

DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Drivers can update assigned deliveries" ON deliveries;

CREATE POLICY "Drivers can view their assigned deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid()
  );

CREATE POLICY "Drivers can update their assigned deliveries"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());
