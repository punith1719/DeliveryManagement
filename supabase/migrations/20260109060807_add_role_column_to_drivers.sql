/*
  # Add Role Column to Drivers Table

  1. Changes
    - Add role column to drivers table ('DRIVER' or 'ADMIN')
    - Default to 'DRIVER' for all existing drivers
  
  2. Security
    - Role determines access permissions via existing RLS policies
*/

-- Add role column to drivers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'role'
  ) THEN
    ALTER TABLE drivers ADD COLUMN role text NOT NULL DEFAULT 'DRIVER' CHECK (role IN ('DRIVER', 'ADMIN'));
  END IF;
END $$;

-- Update existing drivers to have DRIVER role if not set
UPDATE drivers SET role = 'DRIVER' WHERE role IS NULL OR role = '';
