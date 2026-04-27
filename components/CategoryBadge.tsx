import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category, CATEGORY_LABELS } from '@/constants/data';
import { useColors, Radius, Typography } from '@/constants/theme';

interface Props {
  category: Category;
}

export default function CategoryBadge({ category }: Props) {
  const colors = useColors();
  const { bg, text } = colors.cat[category];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>
        {CATEGORY_LABELS[category]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  label: {
    ...Typography.label,
    textTransform: 'uppercase',
  },
});
