/*
  # Add Coordinates to Deliveries Table

  1. Changes
    - `latitude` (numeric) - Customer's latitude coordinate
    - `longitude` (numeric) - Customer's longitude coordinate
    
  2. Sample Data
    - Updates existing deliveries with coordinates
    - NYC locations for demo purposes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliveries' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN latitude NUMERIC;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliveries' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN longitude NUMERIC;
  END IF;
END $$;

-- Update sample deliveries with coordinates
UPDATE deliveries
SET latitude = 40.7614, longitude = -73.9776
WHERE customer_name = 'Alice Johnson';

UPDATE deliveries
SET latitude = 40.6782, longitude = -73.9442
WHERE customer_name = 'Bob Williams';

UPDATE deliveries
SET latitude = 40.7282, longitude = -73.7949
WHERE customer_name = 'Carol Davis';

UPDATE deliveries
SET latitude = 40.7138, longitude = -74.0060
WHERE customer_name = 'David Brown';