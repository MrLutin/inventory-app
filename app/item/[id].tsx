import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStockStatus, CATEGORY_LABELS } from '@/constants/data';
import { getImageUrl } from '@/lib/directusClient';
import { useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import { useInventory } from '@/store/inventory';
import { useAuth } from '@/store/auth';
import StockBadge from '@/components/StockBadge';
import CategoryBadge from '@/components/CategoryBadge';

interface InfoRowProps {
  label: string;
  value: string;
  emoji?: string;
  accent?: boolean;
}

function InfoRow({ label, value, emoji, accent }: InfoRowProps) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.gray600 }]}>{label}</Text>
      <View style={styles.infoRight}>
        {emoji && <Text style={styles.infoEmoji}>{emoji}</Text>}
        <Text style={[styles.infoValue, { color: colors.black }, accent && { color: colors.danger }]}>{value}</Text>
      </View>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { getItem, deleteItem } = useInventory();
  const { isAdmin } = useAuth();
  const item = getItem(id);

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'article',
      `Voulez-vous vraiment supprimer "${item?.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: () => { deleteItem(id); router.back(); },
        },
      ]
    );
  };

  if (!item) {
    return (
      <SafeAreaView style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={styles.nfEmoji}>🔍</Text>
        <Text style={[styles.nfTitle, { color: colors.black }]}>Article introuvable</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const status = getStockStatus(item);
  const stockValue = (item.price * item.quantity).toFixed(2);
  const stockPct = item.minQuantity > 0
    ? Math.min(Math.round((item.quantity / (item.minQuantity * 4)) * 100), 100)
    : 100;

  const stockBarColor =
    status === 'out_of_stock' ? colors.danger
    : status === 'low_stock' ? colors.warning
    : colors.accent;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <SafeAreaView style={[styles.safeTop, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backIcon, { color: colors.black }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.topTitle, { color: colors.black }]} numberOfLines={1}>Fiche article</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.heroEmoji, { backgroundColor: colors.gray100 }]}>
            {getImageUrl(item.image)
              ? <Image source={{ uri: getImageUrl(item.image)! }} style={styles.heroImage} resizeMode="cover" />
              : <Ionicons name="image-outline" size={40} color={colors.gray400} />
            }
          </View>
          <Text style={[styles.heroName, { color: colors.black }]}>{item.name}</Text>
          <View style={styles.heroBadges}>
            <StockBadge status={status} />
            <CategoryBadge category={item.category} color={item.categoryColor} />
          </View>

          <View style={styles.stockBarWrapper}>
            <View style={[styles.stockBarBg, { backgroundColor: colors.gray200 }]}>
              <View style={[styles.stockBarFill, {
                width: `${stockPct}%` as any,
                backgroundColor: stockBarColor,
              }]} />
            </View>
            <Text style={[styles.stockBarLabel, { color: colors.gray400 }]}>
              {item.quantity} / {item.minQuantity * 4} unités
            </Text>
          </View>
        </View>

        {/* Quick metrics */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.black }]}>{item.quantity}</Text>
            <Text style={[styles.metricLabel, { color: colors.gray400 }]}>En stock</Text>
          </View>
          {isAdmin && (
            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.metricValue, { color: colors.black }]}>{item.price.toFixed(2)} $</Text>
              <Text style={[styles.metricLabel, { color: colors.gray400 }]}>Prix unit.</Text>
            </View>
          )}
          {isAdmin && (
            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {parseFloat(stockValue) >= 1000
                  ? `${(parseFloat(stockValue) / 1000).toFixed(1)}k$`
                  : `${stockValue} $`}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.gray400 }]}>Valeur stock</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Section title="Description">
          <Text style={[styles.description, { color: colors.gray600 }]}>{item.description}</Text>
        </Section>

        <Section title="Identification">
          <InfoRow label="SKU" value={item.sku} emoji="🏷️" />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <InfoRow label="Code-barres" value={item.barcode} emoji="📊" />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <InfoRow label="Catégorie" value={CATEGORY_LABELS[item.category] ?? item.category} emoji="📁" />
        </Section>

        <Section title="Stock & logistique">
          <InfoRow label="Quantité totale" value={`${item.quantity} unités`} emoji="📦" accent={status !== 'in_stock'} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <InfoRow label="Quantité minimale" value={`${item.minQuantity} unités`} emoji="⚠️" />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <InfoRow label="Fournisseur" value={item.supplier?.name ?? '—'} emoji="🏭" />
        </Section>

        {item.locations.length > 1 && (
          <Section title="Répartition par emplacement">
            {item.locations.map((loc, idx) => {
              const qty = loc.quantity ?? 0;
              const locColor = qty === 0
                ? colors.danger
                : qty < item.minQuantity ? colors.warning : colors.success;
              const locBg = qty === 0
                ? colors.dangerLight
                : qty < item.minQuantity ? colors.warningLight : colors.successLight;
              return (
                <React.Fragment key={loc.junctionId ?? loc.id}>
                  {idx > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                  <View style={styles.locRow}>
                    <View style={[styles.locDot, { backgroundColor: locColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.locName, { color: colors.black }]}>{loc.name}</Text>
                      {loc.zone ? <Text style={[styles.locZone, { color: colors.gray400 }]}>{loc.zone}</Text> : null}
                    </View>
                    <View style={[styles.locQtyBadge, { backgroundColor: locBg }]}>
                      <Text style={[styles.locQty, { color: locColor }]}>{qty}</Text>
                      <Text style={[styles.locQtyUnit, { color: locColor }]}>unités</Text>
                    </View>
                  </View>
                </React.Fragment>
              );
            })}
          </Section>
        )}

        {isAdmin && (
          <Section title="Finances">
            <InfoRow label="Prix unitaire" value={`${item.price.toFixed(2)} $`} emoji="💶" />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <InfoRow label="Valeur du stock" value={`${stockValue} $`} emoji="💰" accent />
          </Section>
        )}

        <Section title="Informations">
          <InfoRow label="Dernière mise à jour" value={item.lastUpdated} emoji="🗓️" />
        </Section>

        {/* Actions — admin seulement */}
        {isAdmin && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/item/form?id=${item.id}`)}
          >
            <Ionicons name="pencil" size={17} color="#fff" />
            <Text style={styles.primaryBtnText}>Modifier l'article</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
            <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  safeTop: {},
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  backIcon: { fontSize: 26, lineHeight: 30 },
  topTitle: { ...Typography.h4, flex: 1, textAlign: 'center' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 60, gap: Spacing.md },

  // Hero
  heroCard: {
    borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', gap: Spacing.sm, borderWidth: 1, ...Shadow.md,
  },
  heroImage: { width: '100%', height: '100%' },
  heroEmoji: {
    width: 88, height: 88, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  heroName: { ...Typography.h2, textAlign: 'center' },
  heroBadges: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },

  stockBarWrapper: { width: '100%', marginTop: Spacing.sm, gap: 6 },
  stockBarBg: { height: 8, borderRadius: Radius.full, overflow: 'hidden' },
  stockBarFill: { height: '100%', borderRadius: Radius.full },
  stockBarLabel: { ...Typography.caption, textAlign: 'right' },

  // Metrics
  metricsRow: { flexDirection: 'row', gap: Spacing.sm },
  metricCard: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 4, borderWidth: 1, ...Shadow.sm,
  },
  metricValue: { ...Typography.h4 },
  metricLabel: { ...Typography.caption },

  // Sections
  section: { gap: Spacing.sm },
  sectionTitle: {
    ...Typography.label, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 4,
  },
  sectionCard: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },
  separator: { height: 1, marginHorizontal: Spacing.md },

  // Info rows
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 13, gap: Spacing.sm,
  },
  infoLabel: { ...Typography.body },
  infoRight: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '55%' },
  infoEmoji: { fontSize: 15 },
  infoValue: { ...Typography.body, fontWeight: '600', textAlign: 'right' },

  // Description
  description: { ...Typography.body, lineHeight: 22, padding: Spacing.md },

  // Actions
  // Location breakdown
  locRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  locDot: { width: 8, height: 8, borderRadius: 4 },
  locName: { ...Typography.body, fontWeight: '600' },
  locZone: { ...Typography.caption, marginTop: 1 },
  locQtyBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 3, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  locQty: { fontSize: 16, fontWeight: '700' },
  locQtyUnit: { fontSize: 11, fontWeight: '500' },

  actionsSection: { gap: Spacing.sm, marginTop: Spacing.sm },
  primaryBtn: {
    borderRadius: Radius.lg, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, ...Shadow.sm,
  },
  primaryBtnText: { color: '#fff', ...Typography.h4 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { ...Typography.h4 },

  // Not found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  nfEmoji: { fontSize: 56 },
  nfTitle: { ...Typography.h2 },
  backButton: { borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: 12, marginTop: Spacing.md },
  backButtonText: { color: '#fff', ...Typography.h4 },
});
