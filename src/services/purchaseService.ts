import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Product IDs - these should match your App Store Connect / Google Play Console
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

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  type: 'consumable' | 'subscription' | 'non-consumable';
}

export interface Purchase {
  id: string;
  productId: string;
  transactionId: string;
  purchaseDate: Date;
  expirationDate?: Date;
  isActive: boolean;
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

  // Initialize IAP
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // In production, use expo-in-app-purchases or react-native-iap
      // For now, we'll set up mock products
      this.setupMockProducts();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
    }
  }

  private setupMockProducts(): void {
    const mockProducts: Product[] = [
      {
        id: PRODUCT_IDS.COINS_100,
        title: '100 Coins',
        description: 'A small pouch of coins',
        price: '$0.99',
        priceAmount: 0.99,
        currency: 'USD',
        type: 'consumable',
      },
      {
        id: PRODUCT_IDS.COINS_500,
        title: '500 Coins',
        description: 'A bag of coins (Best Value!)',
        price: '$3.99',
        priceAmount: 3.99,
        currency: 'USD',
        type: 'consumable',
      },
      {
        id: PRODUCT_IDS.COINS_1000,
        title: '1000 Coins',
        description: 'A chest of coins',
        price: '$6.99',
        priceAmount: 6.99,
        currency: 'USD',
        type: 'consumable',
      },
      {
        id: PRODUCT_IDS.COINS_5000,
        title: '5000 Coins',
        description: 'A treasure trove!',
        price: '$24.99',
        priceAmount: 24.99,
        currency: 'USD',
        type: 'consumable',
      },
      {
        id: PRODUCT_IDS.PREMIUM_MONTHLY,
        title: 'Premium Monthly',
        description: 'Unlimited voice commands, exclusive companions, and more!',
        price: '$4.99/month',
        priceAmount: 4.99,
        currency: 'USD',
        type: 'subscription',
      },
      {
        id: PRODUCT_IDS.PREMIUM_YEARLY,
        title: 'Premium Yearly',
        description: 'Save 40%! All premium features for a year.',
        price: '$35.99/year',
        priceAmount: 35.99,
        currency: 'USD',
        type: 'subscription',
      },
      {
        id: PRODUCT_IDS.UNLOCK_ALL_ANIMALS,
        title: 'Unlock All Animals',
        description: 'Get access to all companion animals forever!',
        price: '$9.99',
        priceAmount: 9.99,
        currency: 'USD',
        type: 'non-consumable',
      },
      {
        id: PRODUCT_IDS.UNLOCK_PREMIUM_THEMES,
        title: 'Premium Themes',
        description: 'Unlock all premium backgrounds and themes',
        price: '$4.99',
        priceAmount: 4.99,
        currency: 'USD',
        type: 'non-consumable',
      },
      {
        id: PRODUCT_IDS.REMOVE_ADS,
        title: 'Remove Ads',
        description: 'Enjoy an ad-free experience',
        price: '$2.99',
        priceAmount: 2.99,
        currency: 'USD',
        type: 'non-consumable',
      },
    ];

    mockProducts.forEach(p => this.products.set(p.id, p));
  }

  // Get available products
  async getProducts(): Promise<Product[]> {
    await this.initialize();
    return Array.from(this.products.values());
  }

  // Get product by ID
  async getProduct(productId: string): Promise<Product | null> {
    await this.initialize();
    return this.products.get(productId) || null;
  }

  // Purchase a product
  async purchase(userId: string, productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // In production, this would trigger the native IAP flow
      // For now, we'll simulate a successful purchase

      // Record purchase in database
      const { error } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          product_id: productId,
          transaction_id: `mock_${Date.now()}`,
          amount: product.priceAmount,
          currency: product.currency,
          status: 'completed',
          platform: Platform.OS,
        });

      if (error) throw error;

      // Handle product delivery
      await this.deliverProduct(userId, product);

      return { success: true };
    } catch (error) {
      console.error('Purchase failed:', error);
      return { success: false, error: 'Purchase failed. Please try again.' };
    }
  }

  // Deliver purchased product
  private async deliverProduct(userId: string, product: Product): Promise<void> {
    switch (product.id) {
      case PRODUCT_IDS.COINS_100:
        await this.addCoins(userId, 100);
        break;
      case PRODUCT_IDS.COINS_500:
        await this.addCoins(userId, 500);
        break;
      case PRODUCT_IDS.COINS_1000:
        await this.addCoins(userId, 1000);
        break;
      case PRODUCT_IDS.COINS_5000:
        await this.addCoins(userId, 5000);
        break;
      case PRODUCT_IDS.PREMIUM_MONTHLY:
      case PRODUCT_IDS.PREMIUM_YEARLY:
        await this.activateSubscription(userId, product.id);
        break;
      case PRODUCT_IDS.UNLOCK_ALL_ANIMALS:
      case PRODUCT_IDS.UNLOCK_PREMIUM_THEMES:
      case PRODUCT_IDS.REMOVE_ADS:
        await this.unlockFeature(userId, product.id);
        break;
    }
  }

  // Add coins to user wallet
  private async addCoins(userId: string, amount: number): Promise<void> {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('coins')
      .eq('user_id', userId)
      .single();

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ coins: wallet.coins + amount })
        .eq('user_id', userId);
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
      });
  }

  // Unlock a feature
  private async unlockFeature(userId: string, featureId: string): Promise<void> {
    await supabase
      .from('unlocked_features')
      .insert({
        user_id: userId,
        feature_id: featureId,
      });
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

      return {
        isActive,
        productId: data.product_id,
        expirationDate,
        willRenew: data.will_renew,
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

  // Restore purchases
  async restorePurchases(userId: string): Promise<{ success: boolean; restored: number }> {
    try {
      // In production, this would query the app store for previous purchases
      // and restore them to the user's account

      // For now, we'll check our database for existing purchases
      const { data: purchases } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed');

      let restored = 0;

      if (purchases) {
        for (const purchase of purchases) {
          const product = await this.getProduct(purchase.product_id);
          if (product && product.type !== 'consumable') {
            await this.deliverProduct(userId, product);
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
  async getPurchaseHistory(userId: string): Promise<Purchase[]> {
    try {
      const { data } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return (data || []).map(p => ({
        id: p.id,
        productId: p.product_id,
        transactionId: p.transaction_id,
        purchaseDate: new Date(p.created_at),
        isActive: p.status === 'completed',
      }));
    } catch {
      return [];
    }
  }
}

export const purchaseService = new PurchaseService();
export default purchaseService;
