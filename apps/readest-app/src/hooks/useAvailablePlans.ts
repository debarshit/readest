import { useEffect, useState } from 'react';
import { fetchAndTransformIAPPlans, isIAPAvailable } from '@/libs/payment/iap/client';
import { fetchStripePlans } from '@/libs/payment/stripe/client';
import { AvailablePlan } from '@/types/quota';
import { stubTranslation as _ } from '@/utils/misc';

const IAP_PRODUCT_IDS = ['com.biblophile.yomi.plus.monthly', 'com.biblophile.yomi.plus.yearly'];

const WEB_DISPLAY_PLANS: AvailablePlan[] = [
  {
    plan: 'plus',
    productId: 'com.biblophile.yomi.plus.monthly',
    price: 399,
    currency: 'USD',
    interval: 'month',
    productName: 'Yomi Plus',
  },
  {
    plan: 'plus',
    productId: 'com.biblophile.yomi.plus.yearly',
    price: 2999,
    currency: 'USD',
    interval: 'year',
    productName: 'Yomi Plus',
  },
];

interface UseAvailablePlansParams {
  hasIAP: boolean;
  onError?: (message: string) => void;
}

export const useAvailablePlans = ({ hasIAP, onError }: UseAvailablePlansParams) => {
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [iapAvailable, setIapAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        if (hasIAP && (await isIAPAvailable())) {
          const plans = await fetchAndTransformIAPPlans(IAP_PRODUCT_IDS);
          setAvailablePlans(plans);
          setIapAvailable(true);
        } else {
          try {
            const plans = await fetchStripePlans();
            if (plans && plans.length > 0) {
              setAvailablePlans(plans);
            } else {
              setAvailablePlans(WEB_DISPLAY_PLANS);
            }
          } catch {
            setAvailablePlans(WEB_DISPLAY_PLANS);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error(`Failed to fetch ${hasIAP ? 'IAP' : 'Stripe'} plans:`, error);
        setAvailablePlans(WEB_DISPLAY_PLANS);

        if (onError) {
          onError(_('Failed to load subscription plans.'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [hasIAP, onError]);

  return { availablePlans, iapAvailable, loading, error };
};
