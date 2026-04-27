import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

interface Props {
  label: string;
  value: string | number;
  emoji: string;
  accent?: string;
}

export default function StatCard({ label, value, emoji, accent }: Props) {
  const colors = useColors();
  const color = accent ?? colors.primary;

  return (
    <View style={[styles.card, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderTopColor: color,
    }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.gray600 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
    ...Shadow.sm,
    borderWidth: 1,
  },
  emoji: { fontSize: 22, marginBottom: 2 },
  value: { fontSize: 22, fontWeight: '800' },
  label: { ...Typography.caption, textAlign: 'center' },
});
