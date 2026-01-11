import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useCompanionStore } from '../stores/companionStore';
import { Card, Button } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

interface InventoryItem {
  id: string;
  item_id: string;
  item_type: 'accessory' | 'background' | 'boost' | 'cosmetic';
  quantity: number;
  is_equipped: boolean;
  purchased_at: string;
  // Joined from shop_items
  name?: string;
  description?: string;
  image_url?: string;
  rarity?: string;
}

type FilterType = 'all' | 'accessory' | 'background' | 'boost';

const ITEM_EMOJIS: Record<string, string> = {
  'acc_hat_party': '🎉',
  'acc_glasses_cool': '😎',
  'acc_bow_red': '🎀',
  'acc_crown_gold': '👑',
  'acc_wings_angel': '👼',
  'acc_halo': '😇',
  'bg_forest': '🌲',
  'bg_beach': '🏖️',
  'bg_space': '🚀',
  'bg_castle': '🏰',
  'bg_rainbow': '🌈',
  'boost_xp': '⭐',
  'boost_coins': '💰',
  'snack_small': '🍎',
  'snack_medium': '🍱',
  'snack_large': '🎂',
  'energy_drink': '⚡',
};

const RARITY_COLORS: Record<string, string> = {
  common: colors.text.secondary,
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
};

export const InventoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { companion, updateCompanion } = useCompanionStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    if (!user?.id) return;

    try {
      // Get inventory with shop item details
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          shop_items (
            name,
            description,
            image_url,
            rarity
          )
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (error) throw error;

      const items = (data || []).map(item => ({
        ...item,
        name: item.shop_items?.name || item.item_id,
        description: item.shop_items?.description,
        image_url: item.shop_items?.image_url,
        rarity: item.shop_items?.rarity || 'common',
      }));

      setInventory(items);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInventory();
  };

  const handleEquip = async (item: InventoryItem) => {
    if (!user?.id || !companion) return;

    try {
      if (item.item_type === 'accessory') {
        // Get current accessories
        const currentAccessories = companion.accessories || [];
        
        if (item.is_equipped) {
          // Unequip
          const newAccessories = currentAccessories.filter((a: string) => a !== item.item_id);
          await updateCompanion({ accessories: newAccessories });
          
          await supabase
            .from('inventory')
            .update({ is_equipped: false })
            .eq('id', item.id);
        } else {
          // Equip (max 3 accessories)
          if (currentAccessories.length >= 3) {
            Alert.alert('Limit Reached', 'You can only equip up to 3 accessories at a time.');
            return;
          }
          
          const newAccessories = [...currentAccessories, item.item_id];
          await updateCompanion({ accessories: newAccessories });
          
          await supabase
            .from('inventory')
            .update({ is_equipped: true })
            .eq('id', item.id);
        }
      } else if (item.item_type === 'background') {
        // Unequip current background
        await supabase
          .from('inventory')
          .update({ is_equipped: false })
          .eq('user_id', user.id)
          .eq('item_type', 'background');

        if (!item.is_equipped) {
          // Equip new background
          await updateCompanion({ background: item.item_id });
          
          await supabase
            .from('inventory')
            .update({ is_equipped: true })
            .eq('id', item.id);
        } else {
          // Reset to default
          await updateCompanion({ background: 'default' });
        }
      }

      // Refresh inventory
      loadInventory();
    } catch (error) {
      console.error('Failed to equip item:', error);
      Alert.alert('Error', 'Failed to equip item');
    }
  };

  const handleUseBoost = async (item: InventoryItem) => {
    if (!user?.id) return;

    Alert.alert(
      'Use Boost',
      `Use ${item.name}? This will activate the boost for your next 5 tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use',
          onPress: async () => {
            try {
              // Decrease quantity
              const newQuantity = item.quantity - 1;
              
              if (newQuantity <= 0) {
                await supabase
                  .from('inventory')
                  .delete()
                  .eq('id', item.id);
              } else {
                await supabase
                  .from('inventory')
                  .update({ quantity: newQuantity })
                  .eq('id', item.id);
              }

              // Activate boost (store in user profile or separate table)
              const boostType = item.item_id.includes('xp') ? 'xp_boost' : 'coin_boost';
              
              await supabase
                .from('profiles')
                .update({
                  [`active_${boostType}`]: 5, // 5 tasks remaining
                })
                .eq('id', user.id);

              Alert.alert('Boost Activated!', 'Your boost is now active for the next 5 tasks.');
              loadInventory();
            } catch (error) {
              console.error('Failed to use boost:', error);
              Alert.alert('Error', 'Failed to activate boost');
            }
          },
        },
      ]
    );
  };

  const filteredInventory = filter === 'all'
    ? inventory
    : inventory.filter(item => item.item_type === filter);

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📦' },
    { key: 'accessory', label: 'Accessories', icon: '👒' },
    { key: 'background', label: 'Backgrounds', icon: '🖼️' },
    { key: 'boost', label: 'Boosts', icon: '🚀' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Inventory</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={styles.filterIcon}>{f.icon}</Text>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {filteredInventory.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No Items</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? "Your inventory is empty. Visit the shop to get some items!"
                : `You don't have any ${filter}s yet.`}
            </Text>
            <Button
              title="Go to Shop"
              onPress={() => navigation.navigate('Shop' as never)}
              style={styles.shopButton}
            />
          </Card>
        ) : (
          <View style={styles.grid}>
            {filteredInventory.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  item.is_equipped && styles.itemCardEquipped,
                ]}
                onPress={() => {
                  if (item.item_type === 'boost') {
                    handleUseBoost(item);
                  } else {
                    handleEquip(item);
                  }
                }}
              >
                {item.is_equipped && (
                  <View style={styles.equippedBadge}>
                    <Text style={styles.equippedText}>✓</Text>
                  </View>
                )}
                
                <View style={styles.itemEmoji}>
                  <Text style={styles.itemEmojiText}>
                    {ITEM_EMOJIS[item.item_id] || '📦'}
                  </Text>
                </View>
                
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                
                <Text style={[styles.itemRarity, { color: RARITY_COLORS[item.rarity || 'common'] }]}>
                  {item.rarity?.charAt(0).toUpperCase()}{item.rarity?.slice(1)}
                </Text>
                
                {item.quantity > 1 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>x{item.quantity}</Text>
                  </View>
                )}
                
                <Text style={styles.actionText}>
                  {item.item_type === 'boost' 
                    ? 'Tap to use' 
                    : item.is_equipped 
                      ? 'Tap to unequip' 
                      : 'Tap to equip'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>
            • Tap accessories or backgrounds to equip/unequip them{'\n'}
            • You can equip up to 3 accessories at once{'\n'}
            • Boosts are consumed when used{'\n'}
            • Equipped items will appear on your companion
          </Text>
        </Card>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  filterScroll: {
    maxHeight: 50,
    marginTop: spacing.sm,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.accent.primary,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  filterText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  filterTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.medium,
  },
  content: {
    padding: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  itemCard: {
    width: '47%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  itemCardEquipped: {
    borderColor: colors.accent.success,
    backgroundColor: colors.accent.success + '10',
  },
  equippedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: typography.weights.bold,
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
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  itemRarity: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  quantityBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  quantityText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  actionText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  shopButton: {
    minWidth: 150,
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

export default InventoryScreen;
