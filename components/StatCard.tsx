import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

interface Props {
  label: string;
  value: string | number;
  emoji: string;
  accent?: string;
  onPress?: () => void;
  active?: boolean;
}

export default function StatCard({ label, value, emoji, accent, onPress, active }: Props) {
  const colors = useColors();
  const color = accent ?? colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, {
        backgroundColor: active ? color : colors.surface,
        borderColor: active ? color : colors.border,
        borderTopColor: color,
      }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.value, { color: active ? '#fff' : color }]}>{value}</Text>
      <Text style={[styles.label, { color: active ? 'rgba(255,255,255,0.85)' : colors.gray600 }]}>{label}</Text>
    </TouchableOpacity>
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
