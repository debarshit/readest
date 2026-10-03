-- Migration 027: Add customers table for Stripe integration
--
-- The entitlements.ts resolveUserPlan() queries this table to check whether
-- a user has an active Stripe subscription. Without it, IAP verification
-- returns 500 because getHighestActiveStripePlan() throws on a missing table.
--
-- Note: If Stripe is not used in this deployment, the table stays empty and
-- the entitlements code gracefully returns 'free' from the Stripe side.

CREATE TABLE IF NOT EXISTS public.customers (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text        UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_idx
  ON public.customers (user_id);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own customer row (needed by the
-- client-side Stripe billing portal redirect flow).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers' AND policyname = 'select_own_customer'
  ) THEN
    CREATE POLICY select_own_customer
      ON public.customers FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

GRANT SELECT ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
