import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { InventoryItem, getStockStatus } from '@/constants/data';
import { useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import StockBadge from './StockBadge';
import CategoryBadge from './CategoryBadge';

interface Props {
  item: InventoryItem;
}

export default function ItemCard({ item }: Props) {
  const router = useRouter();
  const colors = useColors();
  const status = getStockStatus(item);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.75}
    >
      <View style={[styles.emojiBox, { backgroundColor: colors.gray100 }]}>
        <Text style={styles.emoji}>{item.imageEmoji}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.black }]} numberOfLines={1}>{item.name}</Text>
          <StockBadge status={status} size="sm" />
        </View>
        <Text style={[styles.sku, { color: colors.gray400 }]}>SKU: {item.sku || '—'}</Text>
        <View style={styles.bottomRow}>
          <CategoryBadge category={item.category} />
          <View style={styles.rightMeta}>
            <Text style={[styles.qty, { color: colors.gray600 }]}>
              <Text style={[styles.qtyNum, { color: colors.black }]}>{item.quantity}</Text> unités
            </Text>
            <Text style={[styles.price, { color: colors.primary }]}>{item.price.toFixed(2)} €</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.arrow, { color: colors.gray400 }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
    borderWidth: 1,
  },
  emojiBox: {
    width: 52, height: 52, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  content: { flex: 1, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name: { ...Typography.h4, flex: 1 },
  sku: { ...Typography.bodySmall },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  rightMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qty: { ...Typography.bodySmall },
  qtyNum: { fontWeight: '700' },
  price: { ...Typography.bodySmall, fontWeight: '700' },
  arrow: { fontSize: 22, marginTop: -2 },
});
