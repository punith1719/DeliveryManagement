/*
  # Add Username and Password to Drivers Table

  1. Changes
    - Add username column to drivers table (unique)
    - Add password column to drivers table
    - Support both DRIVER and ADMIN roles with username/password login
  
  2. Security
    - Username must be unique
    - Password stored as plain text for demo (should be hashed in production)
    - Allow public access to drivers table for login authentication
*/

-- Add username and password columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'username'
  ) THEN
    ALTER TABLE drivers ADD COLUMN username text UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'password'
  ) THEN
    ALTER TABLE drivers ADD COLUMN password text;
  END IF;
END $$;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Allow public to read drivers for login" ON drivers;

-- Allow public access to drivers table for login
CREATE POLICY "Allow public to read drivers for login"
  ON drivers FOR SELECT
  TO anon, authenticated
  USING (true);
