import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category, CATEGORY_LABELS } from '@/constants/data';
import { useColors, Radius, Typography } from '@/constants/theme';

interface Props {
  category: Category;
  color?: string | null; // couleur hex depuis Directus
}

/** Retourne une couleur de texte lisible (#fff ou #1a1a1a) selon la luminance du fond */
function textColorFor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1a1a1a' : '#ffffff';
}

/** Retourne une version semi-transparente de la couleur pour le fond du badge */
function bgColorFor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}

export default function CategoryBadge({ category, color }: Props) {
  const colors = useColors();
  const label = (CATEGORY_LABELS as Record<string, string>)[category] ?? category;

  const bg   = color ? bgColorFor(color)   : (colors.cat as any)[category]?.bg   ?? colors.cat['other'].bg;
  const text = color ? color               : (colors.cat as any)[category]?.text ?? colors.cat['other'].text;
  const border = color ?? (colors.cat as any)[category]?.text ?? colors.cat['other'].text;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.label, { color: text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  label: {
    ...Typography.label,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
});
