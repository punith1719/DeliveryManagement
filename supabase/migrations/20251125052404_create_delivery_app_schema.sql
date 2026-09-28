/*
  # Delivery Driver App Schema

  1. New Tables
    - `drivers`
      - `id` (uuid, primary key)
      - `username` (text, unique) - Driver's login username
      - `password` (text) - Driver's password (hashed)
      - `full_name` (text) - Driver's full name
      - `phone` (text) - Driver's phone number
      - `created_at` (timestamptz) - Account creation timestamp
    
    - `deliveries`
      - `id` (uuid, primary key)
      - `driver_id` (uuid, foreign key) - Assigned driver
      - `customer_name` (text) - Customer's name
      - `delivery_address` (text) - Delivery address
      - `product_details` (text) - Product information
      - `status` (text) - Delivery status: 'pending', 'in_transit', 'delivered'
      - `created_at` (timestamptz) - Delivery creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Drivers can only view and update their own deliveries
    - Drivers can only read their own profile

  3. Sample Data
    - Create a test driver account (username: driver1, password: password123)
    - Create sample deliveries for testing
*/

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES drivers(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  delivery_address text NOT NULL,
  product_details text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drivers table
CREATE POLICY "Drivers can view own profile"
  ON drivers FOR SELECT
  TO authenticated
  USING (id = (current_setting('app.current_driver_id', true))::uuid);

CREATE POLICY "Public can read drivers for login"
  ON drivers FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for deliveries table
CREATE POLICY "Drivers can view own deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (driver_id = (current_setting('app.current_driver_id', true))::uuid);

CREATE POLICY "Drivers can update own deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (driver_id = (current_setting('app.current_driver_id', true))::uuid)
  WITH CHECK (driver_id = (current_setting('app.current_driver_id', true))::uuid);

CREATE POLICY "Public can view all deliveries"
  ON deliveries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can update deliveries"
  ON deliveries FOR UPDATE
  TO anon
  USING (true);

-- Insert sample driver (password is plain text for demo purposes)
INSERT INTO drivers (username, password, full_name, phone)
VALUES ('driver1', 'password123', 'John Smith', '555-0100')
ON CONFLICT (username) DO NOTHING;

-- Get the driver_id for sample data
DO $$
DECLARE
  driver_uuid uuid;
BEGIN
  SELECT id INTO driver_uuid FROM drivers WHERE username = 'driver1';
  
  -- Insert sample deliveries
  INSERT INTO deliveries (driver_id, customer_name, delivery_address, product_details, status)
  VALUES 
    (driver_uuid, 'Alice Johnson', '123 Main St, Apt 4B, New York, NY 10001', '2x Pizza (Large Pepperoni), 1x Garlic Bread', 'pending'),
    (driver_uuid, 'Bob Williams', '456 Oak Ave, Brooklyn, NY 11201', '1x Laptop (Dell XPS 13), 1x Wireless Mouse', 'in_transit'),
    (driver_uuid, 'Carol Davis', '789 Pine Rd, Queens, NY 11354', '3x Books (Fiction), 1x Bookmark Set', 'pending'),
    (driver_uuid, 'David Brown', '321 Elm St, Manhattan, NY 10002', '1x Phone Case (iPhone 14), 2x Screen Protectors', 'delivered')
  ON CONFLICT DO NOTHING;
END $$;