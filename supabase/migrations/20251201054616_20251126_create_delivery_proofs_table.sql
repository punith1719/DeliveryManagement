/*
  # Create Delivery Proofs Table

  1. New Tables
    - `delivery_proofs`
      - `id` (uuid, primary key)
      - `delivery_id` (uuid, foreign key to deliveries)
      - `driver_id` (uuid, foreign key to drivers)
      - `photo_url` (text) - URL to captured photo in storage
      - `signature_url` (text) - URL to signature image in storage
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `delivery_proofs` table
    - Add policies for drivers to create and read their own proofs
    - Add policies to prevent modification/deletion of proofs
*/

CREATE TABLE IF NOT EXISTS delivery_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id),
  driver_id uuid NOT NULL REFERENCES drivers(id),
  photo_url text,
  signature_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can create proofs for their deliveries"
  ON delivery_proofs FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid()::uuid);

CREATE POLICY "Drivers can view their own proofs"
  ON delivery_proofs FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid()::uuid);

CREATE POLICY "Drivers cannot update proofs"
  ON delivery_proofs FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Drivers cannot delete proofs"
  ON delivery_proofs FOR DELETE
  TO authenticated
  USING (false);
