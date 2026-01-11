import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWalletStore } from '../stores/walletStore';
import { useCompanionStore } from '../stores/companionStore';
import { Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  category: 'energy' | 'cosmetic' | 'boost';
  effect?: {
    type: 'energy' | 'xp_boost' | 'coin_boost';
    value: number;
  };
}

const SHOP_ITEMS: ShopItem[] = [
  // Energy Items
  {
    id: 'snack_small',
    name: 'Small Snack',
    description: 'Restores 10 energy',
    price: 20,
    emoji: '🍎',
    category: 'energy',
    effect: { type: 'energy', value: 10 },
  },
  {
    id: 'snack_medium',
    name: 'Tasty Meal',
    description: 'Restores 25 energy',
    price: 45,
    emoji: '🍱',
    category: 'energy',
    effect: { type: 'energy', value: 25 },
  },
  {
    id: 'snack_large',
    name: 'Feast',
    description: 'Restores 50 energy',
    price: 80,
    emoji: '🎂',
    category: 'energy',
    effect: { type: 'energy', value: 50 },
  },
  {
    id: 'energy_drink',
    name: 'Energy Potion',
    description: 'Full energy restore!',
    price: 150,
    emoji: '⚡',
    category: 'energy',
    effect: { type: 'energy', value: 100 },
  },
  // Cosmetic Items
  {
    id: 'hat_party',
    name: 'Party Hat',
    description: 'A festive hat for your companion',
    price: 100,
    emoji: '🎉',
    category: 'cosmetic',
  },
  {
    id: 'glasses_cool',
    name: 'Cool Shades',
    description: 'Stylish sunglasses',
    price: 75,
    emoji: '😎',
    category: 'cosmetic',
  },
  {
    id: 'bow_cute',
    name: 'Cute Bow',
    description: 'An adorable bow accessory',
    price: 60,
    emoji: '🎀',
    category: 'cosmetic',
  },
  {
    id: 'crown',
    name: 'Royal Crown',
    description: 'For the most accomplished companions',
    price: 500,
    emoji: '👑',
    category: 'cosmetic',
  },
  // Boost Items
  {
    id: 'xp_boost',
    name: 'XP Boost',
    description: '2x XP for your next 5 tasks',
    price: 100,
    emoji: '⭐',
    category: 'boost',
    effect: { type: 'xp_boost', value: 5 },
  },
  {
    id: 'coin_boost',
    name: 'Coin Boost',
    description: '2x coins for your next 5 tasks',
    price: 100,
    emoji: '💰',
    category: 'boost',
    effect: { type: 'coin_boost', value: 5 },
  },
];

type CategoryFilter = 'all' | 'energy' | 'cosmetic' | 'boost';

export const ShopScreen: React.FC = () => {
  const { wallet, spendCoins } = useWalletStore();
  const { companion, updateEnergy } = useCompanionStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const categories: { key: CategoryFilter; label: string; emoji: string }[] = [
    { key: 'all', label: 'All', emoji: '🛍️' },
    { key: 'energy', label: 'Energy', emoji: '⚡' },
    { key: 'cosmetic', label: 'Cosmetics', emoji: '✨' },
    { key: 'boost', label: 'Boosts', emoji: '🚀' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.category === selectedCategory);

  const handlePurchase = async (item: ShopItem) => {
    if (!wallet || wallet.coins < item.price) {
      Alert.alert(
        'Not Enough Coins',
        `You need ${item.price - (wallet?.coins || 0)} more coins to buy this item.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${item.name} for ${item.price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            const { success, error } = await spendCoins(item.price);
            
            if (success) {
              // Apply effect
              if (item.effect) {
                switch (item.effect.type) {
                  case 'energy':
                    await updateEnergy(item.effect.value);
                    break;
                  // Handle other effects...
                }
              }
              
              Alert.alert(
                'Purchase Complete! 🎉',
                `You bought ${item.name}!`,
                [{ text: 'Yay!' }]
              );
            } else {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.walletBadge}>
          <Text style={styles.walletText}>🪙 {wallet?.coins || 0}</Text>
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => setSelectedCategory(cat.key)}
            style={[
              styles.categoryChip,
              selectedCategory === cat.key && styles.categoryChipActive,
            ]}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === cat.key && styles.categoryTextActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Shop Items */}
      <ScrollView
        style={styles.itemsContainer}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemsGrid}>
          {filteredItems.map(item => {
            const canAfford = (wallet?.coins || 0) >= item.price;
            
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handlePurchase(item)}
                style={[
                  styles.itemCard,
                  !canAfford && styles.itemCardDisabled,
                ]}
              >
                <View style={styles.itemEmoji}>
                  <Text style={styles.itemEmojiText}>{item.emoji}</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={[
                  styles.priceTag,
                  canAfford ? styles.priceTagAffordable : styles.priceTagExpensive,
                ]}>
                  <Text style={styles.priceText}>🪙 {item.price}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 How to earn coins</Text>
          <Text style={styles.infoText}>
            • Complete tasks to earn coins{'\n'}
            • Higher priority tasks = more coins{'\n'}
            • Maintain streaks for bonus rewards{'\n'}
            • Check in daily with your companion
          </Text>
        </Card>

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  walletBadge: {
    backgroundColor: colors.accent.warning + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.accent.warning,
  },
  walletText: {
    color: colors.accent.warning,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.accent.primary,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  categoryTextActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  itemsContainer: {
    flex: 1,
    marginTop: spacing.md,
  },
  itemsContent: {
    paddingHorizontal: spacing.lg,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemCard: {
    width: '47%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  itemCardDisabled: {
    opacity: 0.6,
  },
  itemEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  itemEmojiText: {
    fontSize: 32,
  },
  itemName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  itemDescription: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  priceTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  priceTagAffordable: {
    backgroundColor: colors.accent.success + '30',
  },
  priceTagExpensive: {
    backgroundColor: colors.accent.error + '30',
  },
  priceText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  infoCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary + '30',
  },
  infoTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  infoText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
});

export default ShopScreen;
