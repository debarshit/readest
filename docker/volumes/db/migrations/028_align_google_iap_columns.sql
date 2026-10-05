-- Migration 028: Align google_iap_subscriptions columns with google/server.ts upsert
--
-- Upstream google/server.ts writes auto_renew_status, quantity, purchase_state,
-- acknowledgement_state, and environment. Ensure all these columns exist.

ALTER TABLE public.google_iap_subscriptions 
  ADD COLUMN IF NOT EXISTS auto_renew_status boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS environment text,
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS purchase_state integer,
  ADD COLUMN IF NOT EXISTS acknowledgement_state integer;

-- Sync auto_renew_status from legacy auto_renewing if column was previously populated
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'google_iap_subscriptions' AND column_name = 'auto_renewing'
  ) THEN
    UPDATE public.google_iap_subscriptions
    SET auto_renew_status = COALESCE(auto_renewing, true)
    WHERE auto_renew_status IS NULL;
  END IF;
END $$;
