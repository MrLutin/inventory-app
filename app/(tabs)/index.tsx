import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Category, CATEGORY_LABELS, getStockStatus } from '@/constants/data';
import { useColors, Spacing, Radius, Typography, Shadow } from '@/constants/theme';
import { useInventory } from '@/store/inventory';
import { useAuth } from '@/store/auth';
import ItemCard from '@/components/ItemCard';
import StatCard from '@/components/StatCard';

const CATEGORIES: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'electronics', label: 'Électronique' },
  { key: 'clothing', label: 'Vêtements' },
  { key: 'food', label: 'Alimentation' },
  { key: 'furniture', label: 'Mobilier' },
  { key: 'tools', label: 'Outils' },
  { key: 'other', label: 'Autre' },
];

export default function InventoryScreen() {
  const router = useRouter();
  const { items } = useInventory();
  const { isAdmin, user } = useAuth();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q
        || item.name.toLowerCase().includes(q)
        || item.sku.toLowerCase().includes(q)
        || item.barcode.includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory, items]);

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

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard label="Articles" value={stats.total} emoji="📦" accent={colors.primary} />
              <StatCard label="Stock faible" value={stats.lowStock} emoji="⚠️" accent={colors.warning} />
              <StatCard label="Rupture" value={stats.outOfStock} emoji="🚨" accent={colors.danger} />
            </View>

            {/* Search */}
            <View style={styles.searchWrapper}>
              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, { color: colors.black }]}
                  placeholder="Rechercher par nom, SKU, code-barres…"
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

            {/* Category filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.filterChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setActiveCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.filterLabel,
                      { color: colors.gray600 },
                      isActive && { color: '#fff' },
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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

  filterList: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5 },
  filterLabel: { ...Typography.bodySmall, fontWeight: '600' },

  resultHeader: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, paddingTop: 4 },
  resultCount: { ...Typography.caption, textTransform: 'uppercase', letterSpacing: 0.5 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, textAlign: 'center' },
});
