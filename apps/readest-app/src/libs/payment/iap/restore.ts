import { IAPService, IAPPurchase } from '@/utils/iap';
import { getAccessToken } from '@/utils/access';
import { getNodeAPIBaseUrl } from '@/services/environment';
import { mapProductIdToPlanType } from './utils';

/**
 * Ask Apple / Google for all active purchases and re-verify any subscription
 * not yet registered in our system (or registered under a failed status).
 *
 * Called on:
 *   - App startup (to recover purchases whose client-side verify call was lost
 *     to a network drop, app crash, or mid-flight server error)
 *   - The "Try Again" button on the payment-failed screen
 *
 * The server upserts on (user_id, original_transaction_id) for Apple and
 * (user_id, purchase_token) for Google, so replaying a verify is safe and
 * idempotent — the row is updated, never duplicated.
 */
export async function restoreAndRegisterPurchases(): Promise<{
  restored: boolean;
  platform?: string;
  productId?: string;
}> {
  try {
    const available = await IAPService.isAvailable();
    if (!available) return { restored: false };

    const iapService = new IAPService();
    const purchases = await iapService.restorePurchases();

    // Only attempt re-verification for subscription products — one-time
    // purchases have separate restore logic and don't need this path.
    const activeSubs = purchases.filter(
      (p: IAPPurchase) => mapProductIdToPlanType(p.productId) === 'subscription',
    );
    if (activeSubs.length === 0) return { restored: false };

    const token = await getAccessToken();
    if (!token) return { restored: false };

    const baseUrl = getNodeAPIBaseUrl();

    for (const purchase of activeSubs) {
      try {
        if (purchase.platform === 'ios' && purchase.originalTransactionId) {
          const response = await fetch(`${baseUrl}/apple/iap-verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              transactionId: purchase.transactionId || purchase.originalTransactionId,
              originalTransactionId: purchase.originalTransactionId,
            }),
          });

          if (!response.ok) {
            console.warn(
              `[restore] Apple verify HTTP ${response.status} for ${purchase.originalTransactionId}`,
            );
            continue;
          }

          const { purchase: verified } = await response.json();
          if (verified?.status === 'active') {
            console.log(`[restore] Registered iOS subscription: ${verified.productId}`);
            return { restored: true, platform: 'ios', productId: verified.productId };
          }
        } else if (purchase.platform === 'android' && purchase.purchaseToken) {
          const response = await fetch(`${baseUrl}/google/iap-verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              purchaseToken: purchase.purchaseToken,
              orderId: purchase.orderId || '',
              productId: purchase.productId,
              packageName: purchase.packageName,
            }),
          });

          if (!response.ok) {
            console.warn(
              `[restore] Google verify HTTP ${response.status} for token ${purchase.purchaseToken}`,
            );
            continue;
          }

          const { purchase: verified } = await response.json();
          if (verified?.status === 'active') {
            console.log(`[restore] Registered Android subscription: ${verified.productId}`);
            return { restored: true, platform: 'android', productId: verified.productId };
          }
        }
      } catch (e) {
        console.error('[restore] Failed to re-verify purchase:', purchase.productId, e);
        // Continue — try remaining purchases even if one fails
      }
    }

    return { restored: false };
  } catch (error) {
    console.error('[restore] restoreAndRegisterPurchases failed:', error);
    return { restored: false };
  }
}
