import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { InventoryItem, getStockStatus } from '@/constants/data';
import { getImageUrl } from '@/lib/directusClient';
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
      <View style={[styles.imageBox, { backgroundColor: colors.gray100 }]}>
        {getImageUrl(item.image)
          ? <Image source={{ uri: getImageUrl(item.image)! }} style={styles.image} resizeMode="cover" />
          : <Ionicons name="image-outline" size={26} color={colors.gray400} />
        }
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.black }]} numberOfLines={1}>{item.name}</Text>
          <StockBadge status={status} size="sm" />
        </View>
        <View style={styles.bottomRow}>
          {item.category && item.category !== 'other' && <CategoryBadge category={item.category} color={item.categoryColor} />}
          <Text style={[styles.qty, { color: colors.gray600 }]}>
            <Text style={[styles.qtyNum, { color: colors.black }]}>{item.quantity}</Text> unités
          </Text>
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
  imageBox: {
    width: 52, height: 52, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 52, height: 52 },
  content: { flex: 1, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name: { ...Typography.h4, flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  qty: { ...Typography.bodySmall },
  qtyNum: { fontWeight: '700' },
  arrow: { fontSize: 22, marginTop: -2 },
});
