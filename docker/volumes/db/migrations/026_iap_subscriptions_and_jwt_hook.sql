-- Migration 026: IAP Subscriptions, Plans and Supabase JWT Custom Claims Hook

-- =============================================================================
-- 1. Ensure `plans` Table Exists
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  storage_purchased_bytes bigint NOT NULL DEFAULT 0,
  customization_purchased boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'select_own_plan'
  ) THEN
    CREATE POLICY select_own_plan
      ON public.plans FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = id);
  END IF;
END $$;

GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

-- =============================================================================
-- 2. Ensure Apple & Google IAP Subscription Tables Exist
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.apple_iap_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  product_id text NOT NULL,
  transaction_id text NOT NULL,
  original_transaction_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  purchase_date timestamptz,
  expires_date timestamptz,
  environment text,
  bundle_id text,
  quantity integer DEFAULT 1,
  auto_renew_status boolean DEFAULT true,
  web_order_line_item_id text,
  subscription_group_identifier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT apple_iap_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT apple_iap_subscriptions_user_original_tx_key UNIQUE (user_id, original_transaction_id)
);

ALTER TABLE public.apple_iap_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'apple_iap_subscriptions' AND policyname = 'select_own_apple_subscriptions'
  ) THEN
    CREATE POLICY select_own_apple_subscriptions
      ON public.apple_iap_subscriptions FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

GRANT SELECT ON public.apple_iap_subscriptions TO authenticated;
GRANT ALL ON public.apple_iap_subscriptions TO service_role;

CREATE TABLE IF NOT EXISTS public.google_iap_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  product_id text NOT NULL,
  order_id text,
  purchase_token text NOT NULL,
  package_name text,
  status text NOT NULL DEFAULT 'active',
  purchase_date timestamptz,
  expires_date timestamptz,
  auto_renewing boolean DEFAULT true,
  price_amount_micros bigint,
  price_currency_code text,
  country_code text,
  developer_payload text,
  linked_purchase_token text,
  obfuscated_external_account_id text,
  obfuscated_external_profile_id text,
  cancel_reason integer,
  user_cancellation_time_millis timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_iap_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT google_iap_subscriptions_user_token_key UNIQUE (user_id, purchase_token)
);

ALTER TABLE public.google_iap_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'google_iap_subscriptions' AND policyname = 'select_own_google_subscriptions'
  ) THEN
    CREATE POLICY select_own_google_subscriptions
      ON public.google_iap_subscriptions FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

GRANT SELECT ON public.google_iap_subscriptions TO authenticated;
GRANT ALL ON public.google_iap_subscriptions TO service_role;

-- =============================================================================
-- 3. Auto-Initialize Free Plan on User Signup
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.plans (id, plan, status, storage_purchased_bytes, customization_purchased)
  VALUES (NEW.id, 'free', 'active', 0, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;
CREATE TRIGGER on_auth_user_created_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_plan();

-- Backfill any existing users who lack a plans row
INSERT INTO public.plans (id, plan, status, storage_purchased_bytes, customization_purchased)
SELECT id, 'free', 'active', 0, false
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. Supabase Custom Access Token (JWT) Hook
-- =============================================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_plan text;
  storage_purchased bigint;
  customization_purchased boolean;
BEGIN
  -- Fetch current plan entitlement
  SELECT
    COALESCE(p.plan, 'free'),
    COALESCE(p.storage_purchased_bytes, 0),
    COALESCE(p.customization_purchased, false)
  INTO
    user_plan,
    storage_purchased,
    customization_purchased
  FROM public.plans p
  WHERE p.id = (event->>'user_id')::uuid;

  IF user_plan IS NULL THEN
    user_plan := 'free';
    storage_purchased := 0;
    customization_purchased := false;
  END IF;

  claims := event->'claims';
  claims := jsonb_set(claims, '{plan}', to_jsonb(user_plan));
  claims := jsonb_set(claims, '{storage_purchased_bytes}', to_jsonb(storage_purchased));
  claims := jsonb_set(claims, '{customization_purchased}', to_jsonb(customization_purchased));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- =============================================================================
-- POST-MIGRATION STEP: Enable Custom Access Token Hook in Supabase
-- =============================================================================
-- 1. Open your project in Supabase Dashboard.
-- 2. Go to Authentication -> Hooks (in the sidebar).
-- 3. Under "Custom Access Token (JWT)", click "Add Hook" (or "Edit").
-- 4. Configure:
--      Hook Type: Postgres function
--      Schema: public
--      Function: custom_access_token_hook
-- 5. Click Save.
-- =============================================================================