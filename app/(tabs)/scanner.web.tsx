import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStockStatus } from '@/constants/data';
import { getImageUrl } from '@/lib/directusClient';
import { useInventory } from '@/store/inventory';
import { useColors, Spacing, Radius, Typography, Shadow } from '@/constants/theme';
import StockBadge from '@/components/StockBadge';
import CategoryBadge from '@/components/CategoryBadge';

export default function WebScannerScreen() {
  const colors = useColors();
  const router = useRouter();
  const { items } = useInventory();
  const inputRef = useRef<TextInput>(null);

  const [query,    setQuery]    = useState('');
  const [searched, setSearched] = useState(false);

  const foundItem = searched
    ? items.find(i =>
        i.barcode === query.trim() ||
        i.sku     === query.trim()
      )
    : undefined;

  const handleSearch = () => {
    if (query.trim()) setSearched(true);
  };

  const reset = () => {
    setQuery('');
    setSearched(false);
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Page header ── */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.pageTitle, { color: colors.black }]}>Scanner / Recherche</Text>
        <Text style={[styles.pageSubtitle, { color: colors.gray400 }]}>
          Recherchez un article par code-barres (EAN-13) ou SKU
        </Text>
      </View>

      <View style={styles.content}>

        {/* ── Search card ── */}
        <View style={[styles.searchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name="scan" size={36} color={colors.primary} />
          </View>

          <Text style={[styles.cardTitle, { color: colors.black }]}>Recherche par code</Text>
          <Text style={[styles.cardDesc, { color: colors.gray600 }]}>
            Saisissez le code-barres ou le SKU de l'article. Le scan caméra est disponible sur l'application mobile.
          </Text>

          {/* Input row */}
          <View style={styles.inputRow}>
            <View style={[styles.inputBox, { backgroundColor: colors.gray50, borderColor: colors.border }]}>
              <Ionicons name="barcode-outline" size={20} color={colors.gray400} />
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.black }]}
                placeholder="Ex: 8806090400438 ou APPL-MBP-14"
                placeholderTextColor={colors.gray400}
                value={query}
                onChangeText={v => { setQuery(v); setSearched(false); }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              {query.length > 0 && (
                <Pressable onPress={reset}>
                  <Ionicons name="close-circle" size={18} color={colors.gray400} />
                </Pressable>
              )}
            </View>
            <TouchableOpacity
              style={[styles.searchBtn, { backgroundColor: colors.primary }, !query.trim() && { opacity: 0.5 }]}
              onPress={handleSearch}
              disabled={!query.trim()}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchBtnText}>Rechercher</Text>
            </TouchableOpacity>
          </View>

          {/* ── Result ── */}
          {searched && foundItem && (
            <View style={[styles.resultBox, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
              <View style={styles.resultTop}>
                <View style={styles.resultImageBox}>
                  {getImageUrl(foundItem.image)
                    ? <Image source={{ uri: getImageUrl(foundItem.image)! }} style={styles.resultImage} resizeMode="cover" />
                    : <Ionicons name="image-outline" size={28} color="#999" />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultName, { color: colors.black }]}>{foundItem.name}</Text>
                  <Text style={[styles.resultSku, { color: colors.gray400 }]}>{foundItem.sku}</Text>
                </View>
              </View>
              <View style={styles.resultBadges}>
                <StockBadge status={getStockStatus(foundItem)} />
                <CategoryBadge category={foundItem.category} color={foundItem.categoryColor} />
              </View>
              <Text style={[styles.resultMeta, { color: colors.gray600 }]}>
                📦 {foundItem.quantity} unités · 🪙 {foundItem.price.toFixed(2)} $ · 📍 {foundItem.locations.map(l => l.name).join(', ') || '—'}
              </Text>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={[styles.resultBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/item/${foundItem.id}`)}
                >
                  <Ionicons name="open-outline" size={16} color="#fff" />
                  <Text style={styles.resultBtnText}>Voir la fiche complète</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resultBtnSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={reset}
                >
                  <Text style={[styles.resultBtnSecondaryText, { color: colors.gray600 }]}>
                    Nouvelle recherche
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {searched && !foundItem && (
            <View style={[styles.notFound, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.notFoundTitle, { color: colors.danger }]}>Aucun article trouvé</Text>
                <Text style={[styles.notFoundSub, { color: colors.danger }]}>
                  Aucun article ne correspond à « {query} »
                </Text>
              </View>
              <TouchableOpacity onPress={reset}>
                <Ionicons name="refresh" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Tip ── */}
        <View style={[styles.tip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} style={{ flexShrink: 0 }} />
          <Text style={[styles.tipText, { color: colors.gray600 }]}>
            <Text style={{ fontWeight: '700' }}>Application mobile disponible —</Text>
            {' '}Pour scanner avec la caméra en temps réel, téléchargez l'app iOS ou Android.
          </Text>
        </View>

      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  pageHeader: {
    paddingHorizontal: Spacing.xl, height: 64,
    justifyContent: 'center', borderBottomWidth: 1,
  },
  pageTitle:    { ...Typography.h3 },
  pageSubtitle: { ...Typography.caption, marginTop: 2 },

  content: {
    padding: Spacing.xl, gap: Spacing.md,
    maxWidth: 600, alignSelf: 'center', width: '100%',
  },

  searchCard: {
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.md, ...Shadow.sm,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { ...Typography.h3 },
  cardDesc: { ...Typography.body, textAlign: 'center', lineHeight: 22 },

  inputRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  inputBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 11,
  },
  input: { flex: 1, ...Typography.body, outlineStyle: 'none' as any, padding: 0 },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 11, borderRadius: Radius.md,
  },
  searchBtnText: { color: '#fff', ...Typography.body, fontWeight: '600' },

  // Result found
  resultBox: {
    width: '100%', borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md, gap: Spacing.sm,
  },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  resultImageBox: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  resultImage: { width: 52, height: 52 },
  resultName:  { ...Typography.h4 },
  resultSku:   { ...Typography.bodySmall, marginTop: 2 },
  resultBadges: { flexDirection: 'row', gap: Spacing.sm },
  resultMeta:  { ...Typography.bodySmall, lineHeight: 20 },
  resultActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  resultBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 10, borderRadius: Radius.md,
  },
  resultBtnText: { color: '#fff', ...Typography.body, fontWeight: '600' },
  resultBtnSecondary: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5,
  },
  resultBtnSecondaryText: { ...Typography.body, fontWeight: '600' },

  // Not found
  notFound: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md,
  },
  notFoundTitle: { ...Typography.body, fontWeight: '700' },
  notFoundSub:   { ...Typography.bodySmall, marginTop: 2 },

  // Tip
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md,
  },
  tipText: { ...Typography.body, flex: 1, lineHeight: 22 },
});
