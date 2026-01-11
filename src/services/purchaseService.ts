import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { supabase } from '../lib/supabase';

// Product IDs - must match App Store Connect / Google Play Console
export const PRODUCT_IDS = {
  // Consumables (coin packs)
  COINS_100: 'com.companionai.coins.100',
  COINS_500: 'com.companionai.coins.500',
  COINS_1000: 'com.companionai.coins.1000',
  COINS_5000: 'com.companionai.coins.5000',
  
  // Subscriptions
  PREMIUM_MONTHLY: 'com.companionai.premium.monthly',
  PREMIUM_YEARLY: 'com.companionai.premium.yearly',
  
  // Non-consumables (one-time unlocks)
  UNLOCK_ALL_ANIMALS: 'com.companionai.unlock.animals',
  UNLOCK_PREMIUM_THEMES: 'com.companionai.unlock.themes',
  REMOVE_ADS: 'com.companionai.removeads',
};

// Coin amounts for each product
const COIN_AMOUNTS: Record<string, number> = {
  [PRODUCT_IDS.COINS_100]: 100,
  [PRODUCT_IDS.COINS_500]: 500,
  [PRODUCT_IDS.COINS_1000]: 1000,
  [PRODUCT_IDS.COINS_5000]: 5000,
};

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: string;
  priceCurrencyCode: string;
  type: 'inapp' | 'subs';
}

export interface Purchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseState: number;
}

export interface Subscription {
  isActive: boolean;
  productId?: string;
  expirationDate?: Date;
  willRenew: boolean;
}

class PurchaseService {
  private isInitialized = false;
  private products: Map<string, Product> = new Map();
  private purchaseListener: InAppPurchases.PurchaseListener | null = null;

  // Initialize IAP
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Connect to the store
      const { responseCode } = await InAppPurchases.connectAsync();
      
      if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
        console.error('Failed to connect to IAP:', responseCode);
        return false;
      }

      // Set up purchase listener
      this.purchaseListener = InAppPurchases.setPurchaseListener(
        this.handlePurchaseUpdate.bind(this)
      );

      // Load products
      await this.loadProducts();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      return false;
    }
  }

  // Load products from store
  private async loadProducts(): Promise<void> {
    const allProductIds = Object.values(PRODUCT_IDS);

    try {
      const { responseCode, results } = await InAppPurchases.getProductsAsync(allProductIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        results.forEach((product: any) => {
          this.products.set(product.productId, {
            productId: product.productId,
            title: product.title,
            description: product.description,
            price: product.price,
            priceAmountMicros: product.priceAmountMicros,
            priceCurrencyCode: product.priceCurrencyCode,
            type: product.type,
          });
        });
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  // Handle purchase updates
  private async handlePurchaseUpdate(result: InAppPurchases.InAppPurchase): Promise<void> {
    const { responseCode, results } = result;

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
      for (const purchase of results) {
        if (!purchase.acknowledged) {
          // Process the purchase
          await this.processPurchase(purchase);
          
          // Acknowledge/finish the purchase
          await InAppPurchases.finishTransactionAsync(purchase, true);
        }
      }
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      console.log('User cancelled purchase');
    } else {
      console.error('Purchase failed:', responseCode);
    }
  }

  // Process a completed purchase
  private async processPurchase(purchase: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const productId = purchase.productId;

    try {
      // Record purchase in database
      await supabase.from('purchases').insert({
        user_id: user.id,
        product_id: productId,
        transaction_id: purchase.transactionId,
        amount: this.products.get(productId)?.priceAmountMicros 
          ? parseInt(this.products.get(productId)!.priceAmountMicros) / 1000000 
          : 0,
        currency: this.products.get(productId)?.priceCurrencyCode || 'USD',
        status: 'completed',
        platform: Platform.OS,
        receipt_data: purchase.transactionReceipt,
      });

      // Deliver the product
      await this.deliverProduct(user.id, productId);
    } catch (error) {
      console.error('Failed to process purchase:', error);
    }
  }

  // Deliver purchased product
  private async deliverProduct(userId: string, productId: string): Promise<void> {
    // Handle coin packs
    if (COIN_AMOUNTS[productId]) {
      await this.addCoins(userId, COIN_AMOUNTS[productId]);
      return;
    }

    // Handle subscriptions
    if (productId === PRODUCT_IDS.PREMIUM_MONTHLY || productId === PRODUCT_IDS.PREMIUM_YEARLY) {
      await this.activateSubscription(userId, productId);
      return;
    }

    // Handle non-consumables
    await this.unlockFeature(userId, productId);
  }

  // Add coins to user wallet
  private async addCoins(userId: string, amount: number): Promise<void> {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('coins, lifetime_coins')
      .eq('user_id', userId)
      .single();

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ 
          coins: wallet.coins + amount,
          lifetime_coins: wallet.lifetime_coins + amount,
        })
        .eq('user_id', userId);

      // Record transaction
      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount,
        type: 'purchased',
        description: `Purchased ${amount} coins`,
      });
    }
  }

  // Activate subscription
  private async activateSubscription(userId: string, productId: string): Promise<void> {
    const isYearly = productId === PRODUCT_IDS.PREMIUM_YEARLY;
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + (isYearly ? 12 : 1));

    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        product_id: productId,
        status: 'active',
        expiration_date: expirationDate.toISOString(),
        will_renew: true,
        platform: Platform.OS,
      });
  }

  // Unlock a feature
  private async unlockFeature(userId: string, featureId: string): Promise<void> {
    await supabase
      .from('unlocked_features')
      .upsert({
        user_id: userId,
        feature_id: featureId,
      });
  }

  // Get available products
  async getProducts(): Promise<Product[]> {
    await this.initialize();
    return Array.from(this.products.values());
  }

  // Get product by ID
  getProduct(productId: string): Product | null {
    return this.products.get(productId) || null;
  }

  // Purchase a product
  async purchase(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize();

      const { responseCode } = await InAppPurchases.purchaseItemAsync(productId);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        return { success: true };
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        return { success: false, error: 'Purchase cancelled' };
      } else {
        return { success: false, error: 'Purchase failed' };
      }
    } catch (error) {
      console.error('Purchase error:', error);
      return { success: false, error: 'Purchase failed. Please try again.' };
    }
  }

  // Check subscription status
  async getSubscriptionStatus(userId: string): Promise<Subscription> {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!data) {
        return { isActive: false, willRenew: false };
      }

      const expirationDate = new Date(data.expiration_date);
      const isActive = expirationDate > new Date();

      // If expired, update status
      if (!isActive) {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', data.id);
      }

      return {
        isActive,
        productId: data.product_id,
        expirationDate,
        willRenew: data.will_renew && isActive,
      };
    } catch {
      return { isActive: false, willRenew: false };
    }
  }

  // Check if feature is unlocked
  async isFeatureUnlocked(userId: string, featureId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('unlocked_features')
        .select('id')
        .eq('user_id', userId)
        .eq('feature_id', featureId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  // Check if user has premium (subscription or lifetime)
  async hasPremium(userId: string): Promise<boolean> {
    const subscription = await this.getSubscriptionStatus(userId);
    if (subscription.isActive) return true;

    // Check for lifetime unlocks that grant premium
    const hasAllAnimals = await this.isFeatureUnlocked(userId, PRODUCT_IDS.UNLOCK_ALL_ANIMALS);
    return hasAllAnimals;
  }

  // Restore purchases
  async restorePurchases(): Promise<{ success: boolean; restored: number }> {
    try {
      await this.initialize();

      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
        return { success: false, restored: 0 };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, restored: 0 };

      let restored = 0;

      if (results) {
        for (const purchase of results) {
          // Only restore non-consumables and active subscriptions
          if (
            purchase.productId === PRODUCT_IDS.UNLOCK_ALL_ANIMALS ||
            purchase.productId === PRODUCT_IDS.UNLOCK_PREMIUM_THEMES ||
            purchase.productId === PRODUCT_IDS.REMOVE_ADS ||
            purchase.productId === PRODUCT_IDS.PREMIUM_MONTHLY ||
            purchase.productId === PRODUCT_IDS.PREMIUM_YEARLY
          ) {
            await this.deliverProduct(user.id, purchase.productId);
            restored++;
          }
        }
      }

      return { success: true, restored };
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, restored: 0 };
    }
  }

  // Get purchase history
  async getPurchaseHistory(userId: string): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  }

  // Disconnect from store
  async disconnect(): Promise<void> {
    if (this.purchaseListener) {
      this.purchaseListener.remove();
      this.purchaseListener = null;
    }
    
    await InAppPurchases.disconnectAsync();
    this.isInitialized = false;
  }
}

export const purchaseService = new PurchaseService();
export default purchaseService;
