import { useState, useMemo, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import FilterToggle, { FilterType } from '../components/FilterToggle';
import UserCard from '../components/UserCard';
import { COLORS } from '@/constants/theme';
import { fetchHomeUsers } from '@/features/users/api/homeUsers';
import type { User } from '@/features/users/data/types';
import { useAuth } from '@/shared/store/auth';
import { useUsersList } from '@/features/users/store/userProfileCache';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loggedInUserId } = useAuth();

  // Use cache hook for real-time updates
  const cachedUsers = useUsersList();

  // Show cached users immediately
  useEffect(() => {
    if (cachedUsers) {
      setUsers(cachedUsers);
    }
  }, [cachedUsers]);

  const loadUsers = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchHomeUsers();
      setUsers(list);
    } catch (e) {
      // Only show error if we don't have cached data
      if (!cachedUsers) {
        setError(e instanceof Error ? e.message : 'Could not load users.');
        setUsers([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cachedUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((u) => u.id !== loggedInUserId)
      .filter((u) => !u.isPaused)
      .filter((user) => {
        if (!query) return true;

        const goodAtMatch = user.strengths.some((s) => s.toLowerCase().includes(query));

        const needHelpMatch = user.needs_help_with.some((s) => s.toLowerCase().includes(query));

        if (!filter) return goodAtMatch || needHelpMatch;
        if (filter === 'GOOD_AT') return goodAtMatch;
        if (filter === 'NEED_HELP') return needHelpMatch;

        return true;
      });
  }, [users, search, filter, loggedInUserId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />

      <View style={styles.content}>
        <SearchBar value={search} onChangeText={setSearch} />
        <View style={{ height: 15 }} />
        <FilterToggle value={filter} onChange={setFilter} />
        <View style={{ height: 15 }} />

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <ActivityIndicator style={styles.centered} color={COLORS.textMuted} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : filteredUsers.length === 0 ? (
            <Text style={styles.noResults}>No results found.</Text>
          ) : (
            filteredUsers.map((u) => (
              <View key={u.id} style={{ marginBottom: 10 }}>
                <UserCard user={u} />
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  noResults: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 20,
  },
  centered: {
    marginTop: 32,
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 20,
    paddingHorizontal: 12,
  },
});
