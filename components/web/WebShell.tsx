import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing, Radius, Typography } from '@/constants/theme';
import { useAuth } from '@/store/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItemConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  href: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Inventaire',   icon: 'cube-outline',     activeIcon: 'cube',     href: '/' },
  { label: 'Fournisseurs', icon: 'business-outline', activeIcon: 'business', href: '/suppliers' },
  { label: 'Emplacements', icon: 'location-outline', activeIcon: 'location', href: '/locations' },
  { label: 'Compte',       icon: 'person-outline',   activeIcon: 'person',   href: '/account' },
];

// ─── NavItem ─────────────────────────────────────────────────────────────────

function NavItem({ item, isActive }: { item: NavItemConfig; isActive: boolean }) {
  const colors = useColors();
  const router = useRouter();

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.navItem,
        isActive  && { backgroundColor: `${colors.primary}18` },
        !isActive && hovered && { backgroundColor: colors.gray100 },
      ]}
      onPress={() => router.push(item.href as any)}
    >
      <Ionicons
        name={isActive ? item.activeIcon : item.icon}
        size={19}
        color={isActive ? colors.primary : colors.gray600}
      />
      <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.gray600 }]}>
        {item.label}
      </Text>
      {isActive && <View style={[styles.activeBar, { backgroundColor: colors.primary }]} />}
    </Pressable>
  );
}

// ─── WebShell ────────────────────────────────────────────────────────────────

export default function WebShell({ children }: { children: React.ReactNode }) {
  const colors   = useColors();
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Sidebar ── */}
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>

        {/* Logo */}
        <View style={[styles.logoArea, { borderBottomColor: colors.border }]}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="cube" size={20} color="#fff" />
          </View>
          <View>
            <Text style={[styles.logoTitle, { color: colors.black }]}>Capreit</Text>
            <Text style={[styles.logoSub, { color: colors.gray400 }]}>Gestion d'inventaire</Text>
          </View>
        </View>

        {/* Nav */}
        <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.navSection, { color: colors.gray400 }]}>NAVIGATION</Text>
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}

          {isAdmin && (
            <>
              <Text style={[styles.navSection, { color: colors.gray400, marginTop: Spacing.md }]}>
                ACTIONS
              </Text>
              <Pressable
                style={({ hovered }: any) => [
                  styles.navItem,
                  hovered && { backgroundColor: colors.gray100 },
                ]}
                onPress={() => router.push('/item/form')}
              >
                <Ionicons name="add-circle-outline" size={19} color={colors.accent} />
                <Text style={[styles.navLabel, { color: colors.accent }]}>Nouvel article</Text>
              </Pressable>
              <Pressable
                style={({ hovered }: any) => [
                  styles.navItem,
                  hovered && { backgroundColor: colors.gray100 },
                ]}
                onPress={() => router.push('/suppliers?add=1' as any)}
              >
                <Ionicons name="business-outline" size={19} color={colors.primary} />
                <Text style={[styles.navLabel, { color: colors.primary }]}>Nouveau fournisseur</Text>
              </Pressable>
              <Pressable
                style={({ hovered }: any) => [
                  styles.navItem,
                  hovered && { backgroundColor: colors.gray100 },
                ]}
                onPress={() => router.push('/locations?add=1' as any)}
              >
                <Ionicons name="location-outline" size={19} color="#F97316" />
                <Text style={[styles.navLabel, { color: '#F97316' }]}>Nouvel emplacement</Text>
              </Pressable>
            </>
          )}
        </ScrollView>

        {/* User footer */}
        <View style={[styles.userFooter, { borderTopColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.initials ?? '?'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.black }]} numberOfLines={1}>
              {user?.name}
            </Text>
            <Text style={[styles.userRole, { color: colors.gray400 }]}>
              {isAdmin ? '🛡️ Admin' : '👤 Utilisateur'}
            </Text>
          </View>
          <Pressable
            style={({ hovered }: any) => [
              styles.logoutBtn,
              hovered && { backgroundColor: colors.dangerLight },
            ]}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      {/* ── Main content ── */}
      <View style={[styles.main, { backgroundColor: colors.background }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', minHeight: '100vh' as any },

  sidebar: { width: 240, flexShrink: 0, borderRightWidth: 1 },

  logoArea: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.md, height: 64, borderBottomWidth: 1,
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  logoTitle: { ...Typography.h4 },
  logoSub:   { ...Typography.caption },

  navScroll: { flex: 1, paddingVertical: Spacing.sm },
  navSection: {
    ...Typography.label, letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    marginHorizontal: Spacing.sm, borderRadius: Radius.md,
    position: 'relative', marginBottom: 2,
  },
  navLabel: { ...Typography.body, fontWeight: '500', flex: 1 },
  activeBar: {
    position: 'absolute', right: -Spacing.sm, top: 8, bottom: 8,
    width: 3, borderTopLeftRadius: 2, borderBottomLeftRadius: 2,
  },

  userFooter: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderTopWidth: 1,
  },
  avatar: {
    width: 36, height: 36, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { ...Typography.bodySmall, fontWeight: '800' },
  userInfo:   { flex: 1, minWidth: 0 },
  userName:   { ...Typography.bodySmall, fontWeight: '700' },
  userRole:   { ...Typography.caption },
  logoutBtn:  {
    width: 32, height: 32, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },

  main: { flex: 1, overflow: 'auto' as any },
});
