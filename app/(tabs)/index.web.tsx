import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Category, CATEGORY_LABELS, getStockStatus } from '@/constants/data';
import { useColors, Spacing, Radius, Typography, Shadow } from '@/constants/theme';
import { useInventory } from '@/store/inventory';
import { useAuth } from '@/store/auth';
import StockBadge from '@/components/StockBadge';
import CategoryBadge from '@/components/CategoryBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'quantity' | 'price' | 'value';
type SortDir = 'asc' | 'desc';

const CATEGORIES: { key: Category | 'all'; label: string }[] = [
  { key: 'all',         label: 'Tout' },
  { key: 'electronics', label: 'Électronique' },
  { key: 'clothing',    label: 'Vêtements' },
  { key: 'food',        label: 'Alimentation' },
  { key: 'furniture',   label: 'Mobilier' },
  { key: 'tools',       label: 'Outils' },
  { key: 'other',       label: 'Autre' },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WebInventoryScreen() {
  const router = useRouter();
  const { items, deleteItem } = useInventory();
  const { isAdmin, user } = useAuth();
  const colors = useColors();

  const [search,          setSearch]          = useState('');
  const [activeCategory,  setActiveCategory]  = useState<Category | 'all'>('all');
  const [sortKey,         setSortKey]         = useState<SortKey>('name');
  const [sortDir,         setSortDir]         = useState<SortDir>('asc');

  // ── Filtered + sorted ──
  const filtered = useMemo(() => {
    const result = items.filter(item => {
      const matchCat    = activeCategory === 'all' || item.category === activeCategory;
      const q           = search.toLowerCase();
      const matchSearch = !q
        || item.name.toLowerCase().includes(q)
        || item.sku.toLowerCase().includes(q)
        || item.barcode.includes(q)
        || item.supplier.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    result.sort((a, b) => {
      let av: string | number, bv: string | number;
      switch (sortKey) {
        case 'name':     av = a.name;              bv = b.name; break;
        case 'quantity': av = a.quantity;           bv = b.quantity; break;
        case 'price':    av = a.price;              bv = b.price; break;
        case 'value':    av = a.price * a.quantity; bv = b.price * b.quantity; break;
        default:         av = a.name;              bv = b.name;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    return result;
  }, [search, activeCategory, sortKey, sortDir, items]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total:      items.length,
    lowStock:   items.filter(i => getStockStatus(i) === 'low_stock').length,
    outOfStock: items.filter(i => getStockStatus(i) === 'out_of_stock').length,
    totalValue: items.reduce((s, i) => s + i.price * i.quantity, 0),
  }), [items]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleDelete = (id: string, name: string) => {
    if ((globalThis as any).confirm?.(`Supprimer "${name}" ?`)) deleteItem(id);
  };

  // ── Sort icon ──
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k
      ? <Ionicons name="swap-vertical-outline" size={13} color={colors.gray400} />
      : <Ionicons name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} size={13} color={colors.primary} />;

  // ── Stat card data ──
  const STAT_CARDS = [
    { label: 'Articles',     value: stats.total,      emoji: '📦', color: colors.primary },
    { label: 'Stock faible', value: stats.lowStock,   emoji: '⚠️', color: colors.warning },
    { label: 'Rupture',      value: stats.outOfStock, emoji: '🚨', color: colors.danger  },
    {
      label: 'Valeur totale',
      value: stats.totalValue >= 1000
        ? `${(stats.totalValue / 1000).toFixed(1)}k €`
        : `${stats.totalValue.toFixed(0)} €`,
      emoji: '💰',
      color: colors.accent,
    },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Page header ── */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.black }]}>Inventaire</Text>
          <Text style={[styles.pageSubtitle, { color: colors.gray400 }]}>
            Bonjour {user?.name?.split(' ')[0]} 👋 — {items.length} articles au total
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/item/form')}
          >
            <Ionicons name="add" size={17} color="#fff" />
            <Text style={styles.addBtnText}>Nouvel article</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {STAT_CARDS.map(s => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border, borderTopColor: s.color },
              ]}
            >
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.gray600 }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Toolbar ── */}
        <View style={styles.toolbar}>
          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.gray400} />
            <TextInput
              style={[styles.searchInput, { color: colors.black }]}
              placeholder="Rechercher nom, SKU, code-barres, fournisseur…"
              placeholderTextColor={colors.gray400}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.gray400} />
              </Pressable>
            )}
          </View>

          {/* Category chips */}
          <View style={styles.chips}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  style={({ hovered }: any) => [
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isActive  && { backgroundColor: colors.primary, borderColor: colors.primary },
                    !isActive && hovered && { borderColor: colors.primary },
                  ]}
                  onPress={() => setActiveCategory(cat.key)}
                >
                  <Text style={[styles.chipLabel, { color: isActive ? '#fff' : colors.gray600 }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Table ── */}
        <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          {/* Table header */}
          <View style={[styles.thead, { backgroundColor: colors.gray50, borderBottomColor: colors.border }]}>
            <View style={[styles.colIcon, styles.th]} />
            <Pressable style={[styles.colName, styles.th]} onPress={() => handleSort('name')}>
              <Text style={[styles.thText, { color: colors.gray600 }]}>Nom</Text>
              <SortIcon k="name" />
            </Pressable>
            <View style={[styles.colSku, styles.th]}>
              <Text style={[styles.thText, { color: colors.gray600 }]}>SKU</Text>
            </View>
            <View style={[styles.colCat, styles.th]}>
              <Text style={[styles.thText, { color: colors.gray600 }]}>Catégorie</Text>
            </View>
            <View style={[styles.colStatus, styles.th]}>
              <Text style={[styles.thText, { color: colors.gray600 }]}>Statut</Text>
            </View>
            <Pressable style={[styles.colQty, styles.th]} onPress={() => handleSort('quantity')}>
              <Text style={[styles.thText, { color: colors.gray600 }]}>Qté</Text>
              <SortIcon k="quantity" />
            </Pressable>
            <Pressable style={[styles.colPrice, styles.th]} onPress={() => handleSort('price')}>
              <Text style={[styles.thText, { color: colors.gray600 }]}>Prix</Text>
              <SortIcon k="price" />
            </Pressable>
            <Pressable style={[styles.colValue, styles.th]} onPress={() => handleSort('value')}>
              <Text style={[styles.thText, { color: colors.gray600 }]}>Valeur</Text>
              <SortIcon k="value" />
            </Pressable>
            {isAdmin && <View style={[styles.colActions, styles.th]} />}
          </View>

          {/* Rows */}
          {filtered.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.gray400 }]}>Aucun article trouvé</Text>
            </View>
          ) : (
            filtered.map((item, idx) => {
              const status = getStockStatus(item);
              const val    = (item.price * item.quantity).toFixed(2);
              return (
                <Pressable
                  key={item.id}
                  style={({ hovered }: any) => [
                    styles.tr,
                    { borderBottomColor: colors.border },
                    idx % 2 === 1 && { backgroundColor: colors.gray50 },
                    hovered && { backgroundColor: `${colors.primary}0D` },
                  ]}
                  onPress={() => router.push(`/item/${item.id}`)}
                >
                  <View style={[styles.colIcon, styles.td]}>
                    <Text style={styles.rowEmoji}>{item.imageEmoji}</Text>
                  </View>
                  <View style={[styles.colName, styles.td]}>
                    <Text style={[styles.rowName, { color: colors.black }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.rowSupplier, { color: colors.gray400 }]} numberOfLines={1}>
                      {item.supplier}
                    </Text>
                  </View>
                  <View style={[styles.colSku, styles.td]}>
                    <Text style={[styles.rowMono, { color: colors.gray400 }]} numberOfLines={1}>
                      {item.sku || '—'}
                    </Text>
                  </View>
                  <View style={[styles.colCat, styles.td]}>
                    <CategoryBadge category={item.category} />
                  </View>
                  <View style={[styles.colStatus, styles.td]}>
                    <StockBadge status={status} size="sm" />
                  </View>
                  <View style={[styles.colQty, styles.td]}>
                    <Text style={[
                      styles.rowQty,
                      { color: status !== 'in_stock' ? colors.danger : colors.black },
                    ]}>
                      {item.quantity}
                    </Text>
                  </View>
                  <View style={[styles.colPrice, styles.td]}>
                    <Text style={[styles.rowMono, { color: colors.black }]}>
                      {item.price.toFixed(2)} €
                    </Text>
                  </View>
                  <View style={[styles.colValue, styles.td]}>
                    <Text style={[styles.rowValue, { color: colors.primary }]} numberOfLines={1}>
                      {parseFloat(val) >= 1000
                        ? `${(parseFloat(val) / 1000).toFixed(1)}k €`
                        : `${val} €`}
                    </Text>
                  </View>
                  {isAdmin && (
                    <View style={[styles.colActions, styles.td]}>
                      <Pressable
                        style={({ hovered }: any) => [
                          styles.actionBtn,
                          hovered && { backgroundColor: colors.primaryBg },
                        ]}
                        onPress={(e: any) => { e.stopPropagation?.(); router.push(`/item/form?id=${item.id}`); }}
                      >
                        <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        style={({ hovered }: any) => [
                          styles.actionBtn,
                          hovered && { backgroundColor: colors.dangerLight },
                        ]}
                        onPress={(e: any) => { e.stopPropagation?.(); handleDelete(item.id, item.name); }}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>

        {/* Footer */}
        <Text style={[styles.tableFooter, { color: colors.gray400 }]}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== items.length && ` sur ${items.length}`}
        </Text>

      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, height: 64,
    borderBottomWidth: 1,
  },
  pageTitle:    { ...Typography.h3 },
  pageSubtitle: { ...Typography.caption, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 9, borderRadius: Radius.md,
  },
  addBtnText: { color: '#fff', ...Typography.bodySmall, fontWeight: '700' },

  content: { padding: Spacing.xl, gap: Spacing.md },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 4, borderWidth: 1, borderTopWidth: 3, ...Shadow.sm,
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { ...Typography.caption, textAlign: 'center' },

  // Toolbar
  toolbar: { gap: Spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  searchInput: { flex: 1, ...Typography.body, outlineStyle: 'none' as any, padding: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  chipLabel: { ...Typography.bodySmall, fontWeight: '600' },

  // Table
  table: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  thead: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  tr:    { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  th: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 10, paddingHorizontal: 8,
  },
  td: { paddingVertical: 12, paddingHorizontal: 8 },
  thText: { ...Typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Columns
  colIcon:    { width: 52, alignItems: 'center', justifyContent: 'center' },
  colName:    { flex: 1, minWidth: 140 },
  colSku:     { width: 120 },
  colCat:     { width: 130 },
  colStatus:  { width: 120 },
  colQty:     { width: 65, alignItems: 'center' },
  colPrice:   { width: 90 },
  colValue:   { width: 100 },
  colActions: { width: 72, flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center' },

  rowEmoji:    { fontSize: 22 },
  rowName:     { ...Typography.body, fontWeight: '600' },
  rowSupplier: { ...Typography.caption, marginTop: 1 },
  rowMono:     { ...Typography.bodySmall },
  rowQty:      { ...Typography.body, fontWeight: '700', textAlign: 'center' },
  rowValue:    { ...Typography.bodySmall, fontWeight: '700' },

  actionBtn: {
    width: 28, height: 28, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },

  emptyRow:  { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { ...Typography.body },

  tableFooter: { ...Typography.caption, textAlign: 'right', paddingTop: Spacing.sm },
});
