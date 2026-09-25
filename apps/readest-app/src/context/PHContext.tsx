'use client';

import posthog from 'posthog-js';
import { ReactNode, useEffect } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import { TELEMETRY_DECISION_KEY, TELEMETRY_OPT_OUT_KEY } from '@/utils/telemetry';
import { getAppVersion } from '@/utils/version';
import { getOSPlatform } from '@/utils/misc';
import { isTauriAppPlatform } from '@/services/environment';

// Returns true only if user has explicitly chosen to opt out.
// Default to opt-in for unified ecosystem tracking.
const shouldOptOutAtBoot = () => {
  if (typeof window === 'undefined') return true;
  const decision = localStorage.getItem(TELEMETRY_DECISION_KEY);
  if (decision === 'opt-out') return true;
  return localStorage.getItem(TELEMETRY_OPT_OUT_KEY) === 'true';
};

const posthogUrl =
  process.env['NEXT_PUBLIC_POSTHOG_HOST'] ||
  atob(process.env['NEXT_PUBLIC_DEFAULT_POSTHOG_URL_BASE64']!);
const posthogKey =
  process.env['NEXT_PUBLIC_POSTHOG_KEY'] ||
  atob(process.env['NEXT_PUBLIC_DEFAULT_POSTHOG_KEY_BASE64']!);

if (typeof window !== 'undefined' && posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogUrl,
    person_profiles: 'always',
    autocapture: true,
    opt_out_capturing_by_default: shouldOptOutAtBoot(),
  });
}

export const CSPostHogProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const osPlatform = getOSPlatform();
    const isTauri = isTauriAppPlatform();
    const isStandalonePWA =
      typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches;
    const isMobile = ['ios', 'android'].includes(osPlatform);
    const clientType = isTauri
      ? isMobile
        ? 'mobile_tauri'
        : 'desktop_tauri'
      : isStandalonePWA
        ? 'pwa'
        : 'web';

    // Register super properties that attach to every event sent from Yomi
    posthog.register({
      app_name: 'yomi',
      platform: osPlatform,
      client_type: clientType,
      ecosystem_app: 'reader',
      $app_version: getAppVersion(),
    });

    // Immutable person property set once on very first launch/session
    posthog.people?.set_once?.({
      initial_entry_app: 'yomi',
      initial_entry_platform: `yomi_${osPlatform}`,
      initial_entry_client: clientType,
      initial_entry_timestamp: new Date().toISOString(),
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
