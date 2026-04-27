import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StockStatus, STOCK_LABELS } from '@/constants/data';
import { useColors, Radius, Typography } from '@/constants/theme';

interface Props {
  status: StockStatus;
  size?: 'sm' | 'md';
}

export default function StockBadge({ status, size = 'md' }: Props) {
  const colors = useColors();

  const STATUS_STYLES = {
    in_stock:     { bg: colors.accentLight,  text: colors.accent,  dot: colors.accent },
    low_stock:    { bg: colors.warningLight, text: colors.warning, dot: colors.warning },
    out_of_stock: { bg: colors.dangerLight,  text: colors.danger,  dot: colors.danger },
  };

  const style = STATUS_STYLES[status];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: style.bg },
      isSmall && styles.badgeSm,
    ]}>
      <View style={[styles.dot, { backgroundColor: style.dot }, isSmall && styles.dotSm]} />
      <Text style={[styles.label, { color: style.text }, isSmall && styles.labelSm]}>
        {STOCK_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, gap: 5,
  },
  badgeSm: { paddingHorizontal: 7, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotSm: { width: 5, height: 5 },
  label: { ...Typography.caption, fontWeight: '600' },
  labelSm: { fontSize: 11 },
});
