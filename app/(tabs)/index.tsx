import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStockStatus, StockStatus } from '@/constants/data';

type StatusFilter = 'all' | StockStatus;
import { useColors, Spacing, Radius, Typography, Shadow } from '@/constants/theme';
import { useInventory } from '@/store/inventory';
import { useAuth } from '@/store/auth';
import ItemCard from '@/components/ItemCard';
import StatCard from '@/components/StatCard';

export default function InventoryScreen() {
  const router = useRouter();
  const { items, refresh, loading } = useInventory();
  const { isAdmin, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  const colors = useColors();
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const toggleFilter = (key: StatusFilter) =>
    setStatusFilter(prev => prev === key ? 'all' : key);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const q           = search.toLowerCase();
      const matchSearch = !q
        || item.name.toLowerCase().includes(q)
        || item.sku.toLowerCase().includes(q)
        || item.barcode.includes(q);
      const matchStatus = statusFilter === 'all' || getStockStatus(item) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, items]);

  const stats = useMemo(() => {
    const total = items.length;
    const lowStock = items.filter(i => getStockStatus(i) === 'low_stock').length;
    const outOfStock = items.filter(i => getStockStatus(i) === 'out_of_stock').length;
    return { total, lowStock, outOfStock };
  }, [items]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ItemCard item={item} />}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: colors.gray400 }]}>Bonjour, {user?.name?.split(' ')[0]} 👋</Text>
                <Text style={[styles.title, { color: colors.black }]}>Inventaire</Text>
              </View>
              {isAdmin && (
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/item/form')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Stats row — tap pour filtrer */}
            <View style={styles.statsRow}>
              <StatCard
                label="Articles" value={stats.total} emoji="📦" accent={colors.primary}
                active={statusFilter === 'all'}
                onPress={() => setStatusFilter('all')}
              />
              <StatCard
                label="Stock faible" value={stats.lowStock} emoji="⚠️" accent={colors.warning}
                active={statusFilter === 'low_stock'}
                onPress={() => toggleFilter('low_stock')}
              />
              <StatCard
                label="Rupture" value={stats.outOfStock} emoji="🚨" accent={colors.danger}
                active={statusFilter === 'out_of_stock'}
                onPress={() => toggleFilter('out_of_stock')}
              />
            </View>

            {/* Search */}
            <View style={styles.searchWrapper}>
              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, { color: colors.black }]}
                  placeholder="Rechercher par nom, code-barres…"
                  placeholderTextColor={colors.gray400}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={[styles.clearBtn, { color: colors.gray400 }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Result count */}
            <View style={styles.resultHeader}>
              <Text style={[styles.resultCount, { color: colors.gray400 }]}>
                {filtered.length} article{filtered.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.black }]}>Aucun résultat</Text>
            <Text style={[styles.emptyText, { color: colors.gray400 }]}>Essayez un autre terme ou filtre.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  greeting: { ...Typography.bodySmall, marginBottom: 2 },
  title: { ...Typography.h1 },
  addBtn: {
    width: 44, height: 44, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },

  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },

  searchWrapper: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 1.5,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    gap: Spacing.sm, ...Shadow.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, ...Typography.body, padding: 0 },
  clearBtn: { fontSize: 14, paddingHorizontal: 4 },

  resultHeader: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, paddingTop: 4 },
  resultCount: { ...Typography.caption, textTransform: 'uppercase', letterSpacing: 0.5 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, textAlign: 'center' },
});
