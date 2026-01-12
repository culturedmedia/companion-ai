import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { socialService, Friend, Vibe } from '../services/socialService';
import { useAuthStore } from '../stores/authStore';
import { Card, Button } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';
import { ANIMAL_OPTIONS } from '../types';

type Tab = 'friends' | 'requests' | 'vibes' | 'search';

export const FriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      const [friendsData, requestsData, vibesData] = await Promise.all([
        socialService.getFriends(user.id),
        socialService.getPendingRequests(user.id),
        socialService.getVibes(user.id),
      ]);

      setFriends(friendsData);
      setRequests(requestsData);
      setVibes(vibesData);
    } catch (error) {
      console.error('Failed to load social data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!user?.id || searchQuery.length < 2) return;

    setIsSearching(true);
    try {
      const results = await socialService.searchUsers(searchQuery, user.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    if (!user?.id) return;

    const result = await socialService.sendFriendRequest(user.id, friendId);
    if (result.success) {
      Alert.alert('Request Sent!', 'Your friend request has been sent.');
      setSearchResults(searchResults.filter(r => r.id !== friendId));
    } else {
      Alert.alert('Error', result.error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    const success = await socialService.acceptFriendRequest(friendshipId);
    if (success) {
      loadData();
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    const success = await socialService.declineFriendRequest(friendshipId);
    if (success) {
      setRequests(requests.filter(r => r.id !== friendshipId));
    }
  };

  const handleSendVibe = async (friendId: string) => {
    if (!user?.id) return;

    const result = await socialService.sendVibe(user.id, friendId);
    if (result.success) {
      Alert.alert('Vibe Sent! 💝', 'Your encouragement has been sent!');
    }
  };

  const getAnimalEmoji = (type?: string) => {
    const animal = ANIMAL_OPTIONS.find(a => a.type === type);
    return animal?.emoji || '🐾';
  };

  const renderFriends = () => (
    <View style={styles.tabContent}>
      {friends.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>👋</Text>
          <Text style={styles.emptyTitle}>No Friends Yet</Text>
          <Text style={styles.emptyText}>
            Search for friends to connect and send encouragement!
          </Text>
          <Button
            title="Find Friends"
            onPress={() => setActiveTab('search')}
            style={styles.emptyButton}
          />
        </Card>
      ) : (
        friends.map(friend => (
          <Card key={friend.id} style={styles.friendCard}>
            <View style={styles.friendHeader}>
              <Text style={styles.friendEmoji}>
                {getAnimalEmoji(friend.companionType)}
              </Text>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.displayName}</Text>
                {friend.companionName && (
                  <Text style={styles.companionInfo}>
                    {friend.companionName} • Lvl {friend.companionLevel || 1}
                  </Text>
                )}
                {friend.streak && friend.streak > 0 && (
                  <Text style={styles.streakInfo}>🔥 {friend.streak} day streak</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.vibeButton}
              onPress={() => handleSendVibe(friend.friendId)}
            >
              <Text style={styles.vibeButtonText}>💝 Send Vibe</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </View>
  );

  const renderRequests = () => (
    <View style={styles.tabContent}>
      {requests.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📬</Text>
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptyText}>
            Friend requests will appear here.
          </Text>
        </Card>
      ) : (
        requests.map(request => (
          <Card key={request.id} style={styles.requestCard}>
            <View style={styles.friendHeader}>
              <Text style={styles.friendEmoji}>
                {getAnimalEmoji(request.companionType)}
              </Text>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{request.displayName}</Text>
                {request.companionName && (
                  <Text style={styles.companionInfo}>
                    {request.companionName}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRequest(request.id)}
              >
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => handleDeclineRequest(request.id)}
              >
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
    </View>
  );

  const renderVibes = () => (
    <View style={styles.tabContent}>
      {vibes.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>💝</Text>
          <Text style={styles.emptyTitle}>No Vibes Yet</Text>
          <Text style={styles.emptyText}>
            Encouragement from friends will appear here!
          </Text>
        </Card>
      ) : (
        vibes.map(vibe => (
          <Card 
            key={vibe.id} 
            style={[styles.vibeCard, !vibe.read && styles.vibeCardUnread]}
          >
            <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
            <View style={styles.vibeContent}>
              <Text style={styles.vibeFrom}>
                {vibe.fromUserName}
                {vibe.fromCompanionName && ` & ${vibe.fromCompanionName}`}
              </Text>
              <Text style={styles.vibeMessage}>{vibe.message}</Text>
              <Text style={styles.vibeTime}>
                {new Date(vibe.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card>
        ))
      )}
    </View>
  );

  const renderSearch = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <ActivityIndicator color={colors.accent.primary} style={styles.loader} />
      ) : searchResults.length > 0 ? (
        searchResults.map(result => (
          <Card key={result.id} style={styles.searchResultCard}>
            <View style={styles.friendHeader}>
              <Text style={styles.friendEmoji}>
                {getAnimalEmoji(result.companionType)}
              </Text>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{result.displayName}</Text>
                {result.companionName && (
                  <Text style={styles.companionInfo}>{result.companionName}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendRequest(result.id)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </Card>
        ))
      ) : searchQuery.length > 0 ? (
        <Text style={styles.noResults}>No users found</Text>
      ) : null}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'friends', label: 'Friends', count: friends.length },
          { key: 'requests', label: 'Requests', count: requests.length },
          { key: 'vibes', label: 'Vibes', count: vibes.filter(v => !v.read).length },
          { key: 'search', label: 'Search' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as Tab)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadData();
            }}
            tintColor={colors.accent.primary}
          />
        }
      >
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'vibes' && renderVibes()}
        {activeTab === 'search' && renderSearch()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.accent.primary + '20',
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  tabTextActive: {
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
  },
  badge: {
    backgroundColor: colors.accent.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: spacing.lg,
  },
  tabContent: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
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
  emptyButton: {
    minWidth: 150,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  companionInfo: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  streakInfo: {
    color: colors.accent.warning,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  vibeButton: {
    backgroundColor: colors.accent.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  vibeButtonText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  requestCard: {
    gap: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.accent.success,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  acceptText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  declineButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  declineText: {
    color: colors.text.secondary,
  },
  vibeCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
  },
  vibeEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  vibeContent: {
    flex: 1,
  },
  vibeFrom: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  vibeMessage: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  vibeTime: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
  },
  searchButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  loader: {
    marginTop: spacing.xl,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  noResults: {
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

export default FriendsScreen;
