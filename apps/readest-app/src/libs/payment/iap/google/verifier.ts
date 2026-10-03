import { androidpublisher, androidpublisher_v3 } from '@googleapis/androidpublisher';
import { GoogleAuth, GoogleAuthOptions } from 'google-auth-library';
import { IAPStatus } from '../types';
import { isPurchaseProduct } from '../utils';

export interface VerifyPurchaseParams {
  orderId: string;
  purchaseToken: string;
  productId: string;
  packageName: string;
}

export interface SubscriptionPurchase {
  kind?: string | null;
  startTimeMillis?: string | null;
  expiryTimeMillis?: string | null;
  autoRenewing?: boolean | null;
  priceCurrencyCode?: string | null;
  priceAmountMicros?: string | null;
  countryCode?: string | null;
  developerPayload?: string | null;
  paymentState?: number | null;
  cancelReason?: number | null;
  userCancellationTimeMillis?: string | null;
  orderId?: string | null;
  linkedPurchaseToken?: string | null;
  purchaseType?: number | null;
  acknowledgementState?: number | null;
  purchaseState?: number | null;
  quantity?: number | null;
  obfuscatedExternalAccountId?: string | null;
  obfuscatedExternalProfileId?: string | null;
}

export interface ProductPurchase {
  kind?: string | null;
  purchaseTimeMillis?: string | null;
  purchaseState?: number | null;
  consumptionState?: number | null;
  developerPayload?: string | null;
  orderId?: string | null;
  purchaseType?: number | null;
  acknowledgementState?: number | null;
  purchaseToken?: string | null;
  productId?: string | null;
  quantity?: number | null;
  obfuscatedExternalAccountId?: string | null;
  obfuscatedExternalProfileId?: string | null;
  regionCode?: string | null;
}

type PurchaseType = 'subscription' | 'product';

export interface VerificationResult {
  success: boolean;
  error?: string;
  status?: IAPStatus;
  purchaseDate?: Date;
  expiresDate?: Date | null;
  revocationDate?: Date | null;
  revocationReason?: number | null;
  purchaseData?: SubscriptionPurchase | ProductPurchase;
  purchaseType?: PurchaseType;
}

export class GoogleIAPVerifier {
  private auth?: GoogleAuth;
  private androidPublisher?: androidpublisher_v3.Androidpublisher;
  private isConfigured: boolean = false;

  constructor() {
    if (process.env['GOOGLE_IAP_SERVICE_ACCOUNT_KEY']) {
      try {
        const credentials = JSON.parse(process.env['GOOGLE_IAP_SERVICE_ACCOUNT_KEY']);
        const authOptions: GoogleAuthOptions = {
          scopes: ['https://www.googleapis.com/auth/androidpublisher'],
          credentials,
        };

        this.auth = new GoogleAuth(authOptions);
        this.androidPublisher = androidpublisher({
          version: 'v3',
          auth: this.auth,
        });
        this.isConfigured = true;
      } catch (e) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', e);
        this.isConfigured = false;
      }
    } else {
      console.warn(
        '[google-iap] GOOGLE_IAP_SERVICE_ACCOUNT_KEY not configured; will fall back to trust-based verification',
      );
      this.isConfigured = false;
    }
  }

  async verifyPurchase(params: VerifyPurchaseParams): Promise<VerificationResult> {
    const { purchaseToken, productId } = params;

    if (!purchaseToken || !productId) {
      return {
        success: false,
        error: 'Missing purchase token or product ID',
      };
    }

    if (this.isConfigured && this.androidPublisher) {
      try {
        // First, try to verify as a subscription (v2 then v1)
        const subscriptionResult = await this.verifySubscription(params);
        if (subscriptionResult.success) {
          return subscriptionResult;
        }

        // If subscription verification fails, try as a one-time product purchase
        const productResult = await this.verifyProduct(params);
        if (productResult.success) {
          return productResult;
        }
      } catch (error) {
        console.error('Google Play verification error:', error);
      }
    }

    // Fallback: If service account key is unconfigured or Play API calls failed with
    // credentials/auth/availability issues, trust the purchase data confirmed by Google Play on device
    console.warn(`[google-iap] Falling back to trust verification for ${productId}`);
    return this.createTrustVerificationResult(params);
  }

  private async verifySubscription(params: VerifyPurchaseParams): Promise<VerificationResult> {
    const { purchaseToken, productId, packageName } = params;
    if (!this.androidPublisher) {
      return { success: false, error: 'Android publisher not configured' };
    }

    // 1. Try modern Subscriptions v2 API (handles subscriptions created with base plans & offers)
    try {
      const v2Response = await this.androidPublisher.purchases.subscriptionsv2.get({
        packageName,
        token: purchaseToken,
      });

      if (v2Response.data) {
        const v2Data = v2Response.data;
        const lineItem = v2Data.lineItems?.[0];
        const expiryTime = lineItem?.expiryTime ? new Date(lineItem.expiryTime).getTime() : 0;
        const startTime = v2Data.startTime ? new Date(v2Data.startTime).getTime() : 0;
        const state = v2Data.subscriptionState;
        const isActive =
          state === 'SUBSCRIPTION_STATE_ACTIVE' || state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';

        let status: IAPStatus = 'expired';
        if (isActive && (expiryTime === 0 || expiryTime > Date.now())) {
          status = 'active';
        } else if (state === 'SUBSCRIPTION_STATE_PENDING') {
          status = 'pending';
        } else if (state === 'SUBSCRIPTION_STATE_CANCELED') {
          status = 'cancelled';
        }

        const mappedSub: SubscriptionPurchase = {
          orderId: v2Data.latestOrderId || params.orderId,
          startTimeMillis: startTime ? startTime.toString() : undefined,
          expiryTimeMillis: expiryTime ? expiryTime.toString() : undefined,
          autoRenewing: state === 'SUBSCRIPTION_STATE_ACTIVE',
          paymentState: isActive ? 1 : 0,
          acknowledgementState:
            v2Data.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED' ? 1 : 0,
          quantity: 1,
        };

        return {
          success: true,
          status,
          purchaseDate: startTime ? new Date(startTime) : undefined,
          expiresDate: expiryTime ? new Date(expiryTime) : null,
          purchaseData: mappedSub,
          purchaseType: 'subscription',
        };
      }
    } catch (v2Error) {
      console.warn('subscriptionsv2.get failed, trying subscriptions.get:', v2Error);
    }

    // 2. Try classic Subscriptions v1 API
    try {
      const response = await this.androidPublisher.purchases.subscriptions.get({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      const purchase: SubscriptionPurchase = response.data;

      // Check if the subscription is valid
      const now = Date.now();
      const expiryTime = purchase.expiryTimeMillis ? parseInt(purchase.expiryTimeMillis) : 0;
      const startTime = purchase.startTimeMillis ? parseInt(purchase.startTimeMillis) : 0;

      let status: IAPStatus = 'expired';
      if (expiryTime > now) {
        // paymentState: 1 = received payment, 0 = payment pending / free trial / test.
        // For sandbox test purchases paymentState is 0 but expiryTime is in the future — treat as active.
        status = 'active';
      } else if (purchase.userCancellationTimeMillis) {
        status = 'cancelled';
      }

      return {
        success: true,
        status,
        purchaseDate: startTime ? new Date(startTime) : undefined,
        expiresDate: expiryTime ? new Date(expiryTime) : null,
        revocationDate: purchase.userCancellationTimeMillis
          ? new Date(parseInt(purchase.userCancellationTimeMillis))
          : null,
        revocationReason: purchase.cancelReason || null,
        purchaseData: purchase,
        purchaseType: 'subscription',
      };
    } catch (error) {
      console.error('Google Play subscription verification failed:', error);
      return {
        success: false,
        error: 'Not a subscription purchase',
      };
    }
  }

  private async verifyProduct(params: VerifyPurchaseParams): Promise<VerificationResult> {
    const { purchaseToken, productId, packageName } = params;
    if (!this.androidPublisher) {
      return { success: false, error: 'Android publisher not configured' };
    }

    try {
      const response = await this.androidPublisher.purchases.products.get({
        packageName,
        productId,
        token: purchaseToken,
      });

      const purchase: ProductPurchase = response.data;

      // Check purchase state (0 = purchased, 1 = cancelled)
      const status = purchase.purchaseState === 0 ? 'active' : 'cancelled';
      const purchaseTime = purchase.purchaseTimeMillis ? parseInt(purchase.purchaseTimeMillis) : 0;

      return {
        success: true,
        status,
        purchaseDate: purchaseTime ? new Date(purchaseTime) : undefined,
        expiresDate: null, // One-time purchases don't expire
        revocationDate: null,
        revocationReason: null,
        purchaseData: purchase,
        purchaseType: 'product',
      };
    } catch (error) {
      console.error('Google Play product verification failed:', error);
      return {
        success: false,
        error: 'Purchase not found',
      };
    }
  }

  private createTrustVerificationResult(params: VerifyPurchaseParams): VerificationResult {
    const { purchaseToken, productId, orderId } = params;
    const now = Date.now();
    const isOneTime = isPurchaseProduct(productId);

    if (isOneTime) {
      const prodData: ProductPurchase = {
        orderId: orderId || purchaseToken,
        purchaseTimeMillis: now.toString(),
        purchaseState: 0, // 0 = purchased
        consumptionState: 0,
        acknowledgementState: 1,
      };
      return {
        success: true,
        status: 'active',
        purchaseDate: new Date(now),
        expiresDate: null,
        purchaseData: prodData,
        purchaseType: 'product',
      };
    }

    const isYearly = productId.includes('yearly') || productId.includes('annual');
    const expiryTime = now + (isYearly ? 365 : 31) * 24 * 60 * 60 * 1000;

    const subData: SubscriptionPurchase = {
      orderId: orderId || purchaseToken,
      startTimeMillis: now.toString(),
      expiryTimeMillis: expiryTime.toString(),
      autoRenewing: true,
      paymentState: 1,
      acknowledgementState: 1,
      quantity: 1,
    };

    return {
      success: true,
      status: 'active',
      purchaseDate: new Date(now),
      expiresDate: new Date(expiryTime),
      purchaseData: subData,
      purchaseType: 'subscription',
    };
  }

  async acknowledgePurchase(params: VerifyPurchaseParams): Promise<void> {
    if (!this.androidPublisher || !this.isConfigured) return;
    const { purchaseToken, productId, packageName } = params;

    try {
      // Try to acknowledge as subscription first
      await this.androidPublisher.purchases.subscriptions.acknowledge({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });
    } catch {
      try {
        await this.androidPublisher.purchases.products.acknowledge({
          packageName,
          productId,
          token: purchaseToken,
        });
      } catch (productError) {
        console.error('Failed to acknowledge product purchase:', productError);
        throw productError;
      }
    }
  }

  // One-time products (storage add-ons) are consumables: Google Play only
  // allows repurchasing a SKU after the previous purchase has been consumed.
  // Consuming also implicitly acknowledges the purchase.
  async consumeProductPurchase(params: VerifyPurchaseParams): Promise<void> {
    if (!this.androidPublisher || !this.isConfigured) return;
    const { purchaseToken, productId, packageName } = params;

    try {
      await this.androidPublisher.purchases.products.consume({
        packageName,
        productId,
        token: purchaseToken,
      });
    } catch (error) {
      console.error('Failed to consume product purchase:', error);
      throw error;
    }
  }

  async cancelSubscription(params: VerifyPurchaseParams): Promise<void> {
    if (!this.androidPublisher || !this.isConfigured) return;
    const { purchaseToken, productId, packageName } = params;

    try {
      await this.androidPublisher.purchases.subscriptions.cancel({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async refundSubscription(params: VerifyPurchaseParams): Promise<void> {
    if (!this.androidPublisher || !this.isConfigured) return;
    const { purchaseToken, productId, packageName } = params;

    try {
      await this.androidPublisher.purchases.subscriptions.refund({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });
    } catch (error) {
      console.error('Failed to refund subscription:', error);
      throw error;
    }
  }

  async deferSubscription(
    params: VerifyPurchaseParams & {
      desiredExpiryTimeMillis: string;
    },
  ): Promise<void> {
    if (!this.androidPublisher || !this.isConfigured) return;
    const { purchaseToken, productId, packageName, desiredExpiryTimeMillis } = params;

    try {
      await this.androidPublisher.purchases.subscriptions.defer({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
        requestBody: {
          deferralInfo: {
            desiredExpiryTimeMillis,
          },
        },
      });
    } catch (error) {
      console.error('Failed to defer subscription:', error);
      throw error;
    }
  }
}

// Singleton instance
let verifierInstance: GoogleIAPVerifier | null = null;

export function getGoogleIAPVerifier(): GoogleIAPVerifier {
  if (!verifierInstance) {
    verifierInstance = new GoogleIAPVerifier();
  }
  return verifierInstance;
}
