/*
  # Allow Driver Access to Deliveries

  This migration adds policies to allow drivers to access their assigned deliveries
  even when not authenticated through Supabase Auth.

  1. Changes
    - Add policy to allow public SELECT access to deliveries (filtered by app logic)
    - Add policy to allow public UPDATE access to deliveries (filtered by app logic)
    - Keep existing admin policies intact

  2. Security Note
    - This is a temporary solution
    - Application logic filters deliveries by driver_id
    - For production, drivers should use Supabase Auth
*/

CREATE POLICY "Allow public to view deliveries"
  ON deliveries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to update deliveries"
  ON deliveries
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
