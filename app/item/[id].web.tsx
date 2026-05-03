import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  ScrollView, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStockStatus, CATEGORY_LABELS, STOCK_LABELS } from '@/constants/data';
import { getImageUrl } from '@/lib/directusClient';
import { useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import { useInventory } from '@/store/inventory';
import { useAuth } from '@/store/auth';
import StockBadge from '@/components/StockBadge';
import CategoryBadge from '@/components/CategoryBadge';

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon, label, value, mono, accent, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  mono?: boolean;
  accent?: string;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[iStyles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={[iStyles.iconBox, { backgroundColor: colors.gray100 }]}>
        <Ionicons name={icon} size={15} color={colors.gray600} />
      </View>
      <Text style={[iStyles.label, { color: colors.gray400 }]}>{label}</Text>
      <Text style={[
        iStyles.value,
        { color: accent ?? colors.black },
        mono && { fontFamily: 'monospace' as any },
      ]}>
        {value}
      </Text>
    </View>
  );
}

const iStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: 12,
  },
  iconBox: {
    width: 28, height: 28, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  label: { ...Typography.bodySmall, flex: 1 },
  value: { ...Typography.bodySmall, fontWeight: '700', textAlign: 'right', maxWidth: '55%' },
});

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({ title, icon, children }: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[pStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[pStyles.head, { borderBottomColor: colors.border }]}>
        <Ionicons name={icon} size={15} color={colors.gray400} />
        <Text style={[pStyles.title, { color: colors.gray400 }]}>{title}</Text>
      </View>
      <View style={pStyles.body}>{children}</View>
    </View>
  );
}

const pStyles = StyleSheet.create({
  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },
  head: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { ...Typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  body: { padding: Spacing.lg },
});

// ─── StatPill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, color, sub }: {
  label: string; value: string; color: string; sub?: string;
}) {
  const colors = useColors();
  return (
    <View style={[sPStyles.pill, { backgroundColor: `${color}10`, borderColor: `${color}25` }]}>
      <Text style={[sPStyles.value, { color }]}>{value}</Text>
      <Text style={[sPStyles.label, { color: colors.gray400 }]}>{label}</Text>
      {sub && <Text style={[sPStyles.sub, { color: colors.gray400 }]}>{sub}</Text>}
    </View>
  );
}

const sPStyles = StyleSheet.create({
  pill: {
    flex: 1, borderRadius: Radius.lg, borderWidth: 1,
    paddingVertical: Spacing.md, alignItems: 'center', gap: 3,
  },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { ...Typography.caption },
  sub:   { ...Typography.caption },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WebItemDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const colors   = useColors();
  const { getItem, deleteItem } = useInventory();
  const { isAdmin } = useAuth();
  const item = getItem(id);

  if (!item) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.notFound, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.nfEmoji}>🔍</Text>
          <Text style={[styles.nfTitle, { color: colors.black }]}>Article introuvable</Text>
          <Text style={[styles.nfSub, { color: colors.gray400 }]}>L'article demandé n'existe pas ou a été supprimé.</Text>
          <TouchableOpacity style={[styles.nfBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/')}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={styles.nfBtnText}>Retour à l'inventaire</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status     = getStockStatus(item);
  const stockValue = item.price * item.quantity;
  const stockPct   = item.minQuantity > 0
    ? Math.min(Math.round((item.quantity / (item.minQuantity * 4)) * 100), 100)
    : 100;

  const stockBarColor =
    status === 'out_of_stock' ? colors.danger
    : status === 'low_stock'  ? colors.warning
    : colors.accent;

  const stockBg =
    status === 'out_of_stock' ? colors.dangerLight
    : status === 'low_stock'  ? '#FFF7ED'
    : colors.accentLight;

  const handleDelete = () => {
    if (globalThis.confirm?.(`Supprimer "${item.name}" ? Cette action est irréversible.`)) {
      deleteItem(id);
      router.push('/');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Page header ── */}
      <View style={[styles.pageHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Pressable onPress={() => router.push('/')}>
            {({ hovered }: any) => (
              <Text style={[styles.breadcrumbLink, { color: hovered ? colors.primary : colors.gray400 }]}>
                Inventaire
              </Text>
            )}
          </Pressable>
          <Ionicons name="chevron-forward" size={13} color={colors.gray400} />
          <Text style={[styles.breadcrumbCurrent, { color: colors.black }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        {/* Actions (admin only) */}
        {isAdmin && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/item/form?id=${item.id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={15} color={colors.primary} />
              <Text style={[styles.headerBtnText, { color: colors.primary }]}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.dangerLight, borderColor: '#FECACA' }]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={[styles.headerBtnText, { color: colors.danger }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Body ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>

          {/* ═══════════════════════════════════
              LEFT — Main content
          ═══════════════════════════════════ */}
          <View style={styles.left}>

            {/* Hero card */}
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Color band */}
              <View style={[styles.heroBand, { backgroundColor: stockBg }]}>
                <View style={[styles.heroEmoji, { backgroundColor: colors.surface }]}>
                  {getImageUrl(item.image)
                    ? <Image source={{ uri: getImageUrl(item.image)! }} style={styles.heroImage} resizeMode="cover" />
                    : <Ionicons name="image-outline" size={36} color={colors.gray400} />
                  }
                </View>
              </View>

              <View style={styles.heroContent}>
                <View style={styles.heroTop}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[styles.heroName, { color: colors.black }]}>{item.name}</Text>
                    <View style={styles.heroBadges}>
                      <StockBadge status={status} />
                      <CategoryBadge category={item.category} color={item.categoryColor} />
                    </View>
                  </View>
                </View>

                {item.description ? (
                  <Text style={[styles.heroDescription, { color: colors.gray600 }]}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Stock bar */}
                <View style={[styles.stockBarWrap, { backgroundColor: colors.gray50, borderColor: colors.border }]}>
                  <View style={styles.stockBarRow}>
                    <Text style={[styles.stockBarTitle, { color: colors.gray600 }]}>Niveau de stock</Text>
                    <Text style={[styles.stockBarPct, { color: stockBarColor }]}>{stockPct}%</Text>
                  </View>
                  <View style={[styles.stockBg, { backgroundColor: colors.gray200 }]}>
                    <View style={[styles.stockFill, { width: `${stockPct}%` as any, backgroundColor: stockBarColor }]} />
                  </View>
                  <View style={styles.stockBarFooter}>
                    <Text style={[styles.stockBarSub, { color: colors.gray400 }]}>
                      {item.quantity} unités en stock
                    </Text>
                    <Text style={[styles.stockBarSub, { color: colors.gray400 }]}>
                      Min. {item.minQuantity} · Max. {item.minQuantity * 4}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Identification */}
            <Panel title="Identification" icon="pricetag-outline">
              <InfoRow icon="barcode-outline"       label="Code-barres"  value={item.barcode}                    mono />
              <InfoRow icon="layers-outline"        label="SKU"          value={item.sku}                        mono />
              <InfoRow icon="grid-outline"          label="Catégorie"    value={CATEGORY_LABELS[item.category] ?? item.category}  last />
            </Panel>

            {/* Stock & logistique */}
            <Panel title="Stock & logistique" icon="cube-outline">
              <InfoRow
                icon="cube-outline"
                label="Quantité totale"
                value={`${item.quantity} unités`}
                accent={status !== 'in_stock' ? stockBarColor : undefined}
              />
              <InfoRow icon="alert-circle-outline" label="Quantité minimale" value={`${item.minQuantity} unités`} />
              <InfoRow icon="business-outline"     label="Fournisseur"       value={item.supplier?.name ?? '—'} last />
            </Panel>

            {/* Répartition par emplacement */}
            {item.locations.length > 1 && (
              <Panel title="Répartition par emplacement" icon="location-outline">
                {item.locations.map((loc, idx) => {
                  const qty = loc.quantity ?? 0;
                  const locColor = qty === 0
                    ? colors.danger
                    : qty < item.minQuantity ? colors.warning : colors.success;
                  const locBg = qty === 0
                    ? colors.dangerLight
                    : qty < item.minQuantity ? colors.warningLight : colors.successLight;
                  return (
                    <View
                      key={loc.junctionId ?? loc.id}
                      style={[
                        styles.locRow,
                        idx < item.locations.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#0000000D' },
                      ]}
                    >
                      <View style={[styles.locDot, { backgroundColor: locColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.locName, { color: colors.black }]}>{loc.name}</Text>
                        {loc.zone ? <Text style={[styles.locZone, { color: colors.gray400 }]}>{loc.zone}</Text> : null}
                      </View>
                      <View style={[styles.locBadge, { backgroundColor: locBg }]}>
                        <Text style={[styles.locQty, { color: locColor }]}>{qty}</Text>
                        <Text style={[styles.locUnit, { color: locColor }]}> unités</Text>
                      </View>
                    </View>
                  );
                })}
              </Panel>
            )}

            {/* Finances — admin seulement */}
            {isAdmin && (
              <Panel title="Finances" icon="cash-outline">
                <InfoRow icon="pricetag-outline"  label="Prix unitaire"  value={`${item.price.toFixed(2)} $`} />
                <InfoRow
                  icon="wallet-outline"
                  label="Valeur du stock"
                  value={`${stockValue.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`}
                  accent={colors.primary}
                  last
                />
              </Panel>
            )}

            {/* Metadata */}
            <Panel title="Informations" icon="information-circle-outline">
              <InfoRow icon="time-outline"      label="Dernière mise à jour" value={item.lastUpdated} last />
            </Panel>

          </View>

          {/* ═══════════════════════════════════
              RIGHT — Sidebar panels
          ═══════════════════════════════════ */}
          <View style={styles.right}>

            {/* Status card */}
            <View style={[styles.statusCard, { backgroundColor: stockBg, borderColor: `${stockBarColor}40` }]}>
              <View style={styles.statusTop}>
                <View style={[styles.statusDot, { backgroundColor: stockBarColor }]} />
                <Text style={[styles.statusLabel, { color: stockBarColor }]}>
                  {STOCK_LABELS[status]}
                </Text>
              </View>
              <Text style={[styles.statusSub, { color: colors.gray600 }]}>
                {status === 'out_of_stock'
                  ? 'Réapprovisionnement urgent requis.'
                  : status === 'low_stock'
                  ? `Seuil minimum atteint (${item.minQuantity} unités).`
                  : `Stock suffisant — ${item.quantity} unités disponibles.`
                }
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatPill
                label="En stock"
                value={String(item.quantity)}
                color={stockBarColor}
                sub="unités"
              />
              {isAdmin && (
                <StatPill
                  label="Prix unit."
                  value={`${item.price.toFixed(2)} $`}
                  color={colors.primary}
                />
              )}
            </View>
            {isAdmin && (
              <StatPill
                label="Valeur totale du stock"
                value={stockValue >= 1000
                  ? `${(stockValue / 1000).toFixed(2)} k$`
                  : `${stockValue.toFixed(2)} $`}
                color={colors.primary}
              />
            )}

            {/* Quick info */}
            <View style={[styles.quickInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.quickRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.quickLabel, { color: colors.gray400 }]}>SKU</Text>
                <Text style={[styles.quickValue, { color: colors.black }]}>{item.sku}</Text>
              </View>
              <View style={[styles.quickRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.quickLabel, { color: colors.gray400 }]}>Emplacement</Text>
                <Text style={[styles.quickValue, { color: colors.black }]}>{item.locations.map(l => l.name).join(', ') || '—'}</Text>
              </View>
              <View style={styles.quickRow}>
                <Text style={[styles.quickLabel, { color: colors.gray400 }]}>Fournisseur</Text>
                <Text style={[styles.quickValue, { color: colors.black }]}>{item.supplier?.name ?? '—'}</Text>
              </View>
            </View>

            {/* Actions */}
            {isAdmin && (
              <View style={styles.sideActions}>
                <TouchableOpacity
                  style={[styles.sideBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/item/form?id=${item.id}`)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="pencil-outline" size={17} color="#fff" />
                  <Text style={styles.sideBtnText}>Modifier l'article</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sideBtnDanger, { backgroundColor: colors.dangerLight, borderColor: '#FECACA' }]}
                  onPress={handleDelete}
                  activeOpacity={0.85}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.sideBtnDangerText, { color: colors.danger }]}>Supprimer l'article</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, height: 56, borderBottomWidth: 1,
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  breadcrumbLink:    { ...Typography.bodySmall, fontWeight: '600' },
  breadcrumbCurrent: { ...Typography.bodySmall, fontWeight: '700', flexShrink: 1 },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.md, borderWidth: 1.5,
  },
  headerBtnText: { ...Typography.bodySmall, fontWeight: '700' },

  // Body layout
  body: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.xl, gap: Spacing.xl,
    maxWidth: 1100, alignSelf: 'center', width: '100%',
  },
  left:  { flex: 1, gap: Spacing.lg },
  right: { width: 280, gap: Spacing.md },

  // Hero card
  heroCard: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadow.md },
  heroBand: { height: 90, alignItems: 'flex-start', justifyContent: 'flex-end', paddingHorizontal: Spacing.xl, paddingBottom: 0 },
  heroEmoji: {
    width: 76, height: 76, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: -28, overflow: 'hidden',
    ...Shadow.md,
  },
  heroImage: { width: 76, height: 76 },
  heroContent:   { paddingHorizontal: Spacing.xl, paddingTop: 40, paddingBottom: Spacing.xl, gap: Spacing.md },
  heroTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  heroName:      { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  heroBadges:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  heroDescription: { ...Typography.body, lineHeight: 22, color: '#64748B' },

  stockBarWrap: {
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md, gap: 10, marginTop: Spacing.sm,
  },
  stockBarRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockBarTitle:  { ...Typography.bodySmall, fontWeight: '600' },
  stockBarPct:    { ...Typography.body, fontWeight: '800' },
  stockBg:        { height: 8, borderRadius: Radius.full, overflow: 'hidden' },
  stockFill:      { height: '100%', borderRadius: Radius.full },
  stockBarFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  stockBarSub:    { ...Typography.caption },

  // Right sidebar
  statusCard: {
    borderRadius: Radius.xl, borderWidth: 1.5,
    padding: Spacing.md, gap: 8,
  },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { ...Typography.body, fontWeight: '800' },
  statusSub:   { ...Typography.bodySmall, lineHeight: 18 },

  statsGrid: { flexDirection: 'row', gap: Spacing.sm },

  quickInfo: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },
  quickRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  quickLabel: { ...Typography.caption, flex: 1 },
  quickValue: { ...Typography.caption, fontWeight: '700', textAlign: 'right', maxWidth: '60%' },

  sideActions: { gap: Spacing.sm },
  sideBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 12, borderRadius: Radius.lg, ...Shadow.sm,
  },
  sideBtnText: { ...Typography.body, color: '#fff', fontWeight: '700' },
  sideBtnDanger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 12, borderRadius: Radius.lg, borderWidth: 1,
  },
  sideBtnDangerText: { ...Typography.bodySmall, fontWeight: '700' },

  // Not found
  notFound: {
    margin: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1,
    padding: 48, alignItems: 'center', gap: Spacing.md, ...Shadow.sm,
  },
  nfEmoji: { fontSize: 56 },
  nfTitle:  { ...Typography.h2 },
  nfSub:    { ...Typography.body, textAlign: 'center' },
  nfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderRadius: Radius.lg, marginTop: Spacing.sm,
  },
  nfBtnText: { ...Typography.body, color: '#fff', fontWeight: '700' },

  // Location breakdown
  locRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  locDot:   { width: 8, height: 8, borderRadius: 4 },
  locName:  { ...Typography.body, fontWeight: '600' },
  locZone:  { ...Typography.caption, marginTop: 1 },
  locBadge: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  locQty:   { fontSize: 15, fontWeight: '700' },
  locUnit:  { fontSize: 11, fontWeight: '500' },
});
