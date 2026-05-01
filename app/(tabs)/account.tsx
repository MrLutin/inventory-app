import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import { useAuth } from '@/store/auth';

const APP_VERSION = Constants.expoConfig?.version ?? '—';
const APP_NAME    = Constants.expoConfig?.name    ?? '—';
const APP_SLUG    = Constants.expoConfig?.slug    ?? '—';

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  accent?: string;
  onPress?: () => void;
}

function MenuRow({ icon, iconBg, iconColor, label, sublabel, accent, onPress }: MenuRowProps) {
  const colors = useColors();
  const color = accent ?? iconColor ?? colors.black;
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.65}>
      <View style={[styles.menuIconBox, { backgroundColor: accent ? `${accent}18` : (iconBg ?? colors.gray100) }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color: accent ?? colors.black }]}>{label}</Text>
        {sublabel && <Text style={[styles.menuSublabel, { color: colors.gray400 }]}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>{title}</Text>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const colors = useColors();

  const roleBadge = isAdmin
    ? { label: 'Administrateur', bg: colors.primaryBg, text: colors.primary, icon: 'shield-checkmark-outline' as const }
    : { label: 'Utilisateur', bg: colors.gray100, text: colors.gray600, icon: 'person-outline' as const };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={[styles.pageTitle, { color: colors.black }]}>Compte</Text>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryBg, borderColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.initials ?? 'ML'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.black }]}>{user?.name ?? '—'}</Text>
            <Text style={[styles.profileEmail, { color: colors.gray400 }]}>{user?.email ?? '—'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
              <Ionicons name={roleBadge.icon} size={11} color={roleBadge.text} />
              <Text style={[styles.roleLabel, { color: roleBadge.text }]}>{roleBadge.label}</Text>
            </View>
          </View>
        </View>

        {/* Gestion */}
        <SectionTitle title="Gestion" />
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MenuRow
            icon="business-outline"
            iconBg={colors.primaryBg}
            iconColor={colors.primary}
            label="Fournisseurs"
            sublabel="8 fournisseurs"
            onPress={() => router.push('/suppliers')}
          />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="location-outline"
            iconBg="#FFF7ED"
            iconColor="#F97316"
            label="Emplacements"
            sublabel="4 zones de stockage"
            onPress={() => router.push('/locations')}
          />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="people-outline"
            label="Utilisateurs"
            sublabel="3 membres actifs"
          />
        </View>

        {/* Préférences */}
        <SectionTitle title="Préférences" />
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MenuRow icon="notifications-outline" label="Notifications" sublabel="Alertes stock activées" />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <MenuRow icon="language-outline" label="Langue" sublabel="Français" />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <MenuRow icon="moon-outline" label="Apparence" sublabel="Système" />
        </View>

        {/* Application */}
        <SectionTitle title="Application" />
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MenuRow icon="help-circle-outline" label="Aide & Support" />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <MenuRow icon="shield-checkmark-outline" label="Confidentialité" />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <MenuRow icon="information-circle-outline" label="Version"   sublabel={APP_VERSION} />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <MenuRow icon="cube-outline"               label="Nom"       sublabel={APP_NAME} />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <MenuRow icon="at-outline"                 label="Slug"      sublabel={APP_SLUG} />
        </View>

        {/* Déconnexion */}
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MenuRow icon="log-out-outline" label="Se déconnecter" accent={colors.danger} onPress={logout} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  pageTitle: { ...Typography.h1, marginBottom: Spacing.sm },

  profileCard: {
    borderRadius: Radius.xl, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, ...Shadow.sm,
  },
  avatar: {
    width: 56, height: 56, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { ...Typography.h4, fontWeight: '800' },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { ...Typography.h4 },
  profileEmail: { ...Typography.bodySmall, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    gap: 4, alignSelf: 'flex-start' as const,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  roleLabel: { ...Typography.caption, fontWeight: '600' as const },

  sectionTitle: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginTop: Spacing.sm,
  },

  menuCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    overflow: 'hidden', ...Shadow.sm,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 13, gap: Spacing.md,
  },
  menuIconBox: {
    width: 34, height: 34, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { ...Typography.body, fontWeight: '500' },
  menuSublabel: { ...Typography.bodySmall, marginTop: 1 },
  sep: { height: 1, marginLeft: 62 },
});
