import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import { useAuth } from '@/store/auth';

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
  readOnly?: boolean;
  hint?: string;
}

function Field({ label, value, onChange, placeholder, icon, keyboardType = 'default', secureTextEntry, readOnly, hint }: FieldProps) {
  const colors  = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={fStyles.wrapper}>
      <Text style={[fStyles.label, { color: colors.gray600 }]}>{label}</Text>
      <View style={[
        fStyles.row,
        { borderColor: colors.border, backgroundColor: readOnly ? colors.gray50 : colors.surface },
        focused && !readOnly && { borderColor: colors.primary, backgroundColor: colors.surface },
      ]}>
        <Ionicons name={icon} size={17} color={focused && !readOnly ? colors.primary : colors.gray400} />
        <TextInput
          style={[fStyles.input, { color: readOnly ? colors.gray600 : colors.black, outlineStyle: 'none' as any }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          secureTextEntry={secureTextEntry}
          editable={!readOnly}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {readOnly && <Ionicons name="lock-closed-outline" size={15} color={colors.gray400} />}
      </View>
      {hint && <Text style={[fStyles.hint, { color: colors.gray400 }]}>{hint}</Text>}
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label:   { ...Typography.bodySmall, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, ...Typography.body, padding: 0 },
  hint:  { ...Typography.caption },
});

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, icon, children }: {
  title: string; subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.sectionHead, { borderBottomColor: colors.border }]}>
        <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryBg }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.black }]}>{title}</Text>
          {subtitle && <Text style={[styles.sectionSub, { color: colors.gray400 }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  const colors = useColors();
  const isOk   = type === 'success';
  return (
    <View style={[
      styles.toast,
      { backgroundColor: isOk ? colors.accentLight : colors.dangerLight, borderColor: isOk ? colors.accent : colors.danger },
    ]}>
      <Ionicons name={isOk ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={16} color={isOk ? colors.accent : colors.danger} />
      <Text style={[styles.toastText, { color: isOk ? colors.accent : colors.danger }]}>{message}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WebAccountScreen() {
  const colors = useColors();
  const { user, logout, isAdmin } = useAuth();

  // ── Profile form state ──
  const [name,  setName]  = useState(user?.name  ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── Password form state ──
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwds,   setShowPwds]   = useState(false);
  const [pwdMsg,     setPwdMsg]     = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const roleBadge = isAdmin
    ? { label: 'Administrateur', bg: colors.primaryBg, text: colors.primary, icon: 'shield-checkmark-outline' as const }
    : { label: 'Utilisateur', bg: colors.gray100, text: colors.gray600, icon: 'person-outline' as const };

  // ── Handlers ──

  const handleSaveProfile = () => {
    if (!name.trim()) {
      setProfileMsg({ text: 'Le nom ne peut pas être vide.', type: 'error' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setProfileMsg({ text: 'Adresse email invalide.', type: 'error' });
      return;
    }
    // (mock save — would call API in production)
    setProfileMsg({ text: 'Profil mis à jour avec succès.', type: 'success' });
    setTimeout(() => setProfileMsg(null), 3500);
  };

  const handleSavePassword = () => {
    if (!currentPwd) {
      setPwdMsg({ text: 'Veuillez saisir votre mot de passe actuel.', type: 'error' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.', type: 'error' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    setPwdMsg({ text: 'Mot de passe modifié avec succès.', type: 'success' });
    setTimeout(() => setPwdMsg(null), 3500);
  };

  const profileDirty = name !== (user?.name ?? '') || email !== (user?.email ?? '');
  const pwdReady     = currentPwd.length > 0 && newPwd.length >= 6 && confirmPwd.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Page header ── */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.pageTitle, { color: colors.black }]}>Mon compte</Text>
        <Text style={[styles.pageSubtitle, { color: colors.gray400 }]}>
          Gérez vos informations personnelles et votre sécurité
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* ── Profile summary ── */}
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {/* Avatar */}
            <View style={[styles.avatarRing, { borderColor: `${colors.primary}30` }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.initials ?? '?'}</Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.profileMeta}>
              <Text style={[styles.profileName, { color: colors.black }]}>{user?.name ?? '—'}</Text>
              <Text style={[styles.profileEmail, { color: colors.gray400 }]}>{user?.email ?? '—'}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                <Ionicons name={roleBadge.icon} size={12} color={roleBadge.text} />
                <Text style={[styles.roleLabel, { color: roleBadge.text }]}>{roleBadge.label}</Text>
              </View>
            </View>

            {/* Logout shortcut */}
            <Pressable
              style={({ hovered }: any) => [
                styles.logoutBtn,
                { borderColor: colors.border, backgroundColor: colors.background },
                hovered && { backgroundColor: colors.dangerLight, borderColor: colors.danger },
              ]}
              onPress={logout}
            >
              <Ionicons name="log-out-outline" size={16} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>Se déconnecter</Text>
            </Pressable>
          </View>

          {/* ── Personal info ── */}
          <SectionCard title="Informations personnelles" subtitle="Votre nom et adresse email affichés dans l'application" icon="person-outline">
            <Field
              label="Nom complet"
              value={name}
              onChange={setName}
              placeholder="Ex: Marie Dupont"
              icon="person-outline"
            />
            <Field
              label="Adresse email"
              value={email}
              onChange={setEmail}
              placeholder="vous@example.com"
              icon="mail-outline"
              keyboardType="email-address"
            />
            <Field
              label="Rôle"
              value={roleBadge.label}
              icon="shield-checkmark-outline"
              readOnly
              hint="Le rôle est attribué par un administrateur."
            />

            {profileMsg && <Toast message={profileMsg.text} type={profileMsg.type} />}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: profileDirty ? colors.primary : colors.gray200 },
              ]}
              onPress={handleSaveProfile}
              disabled={!profileDirty}
              activeOpacity={0.85}
            >
              <Ionicons name="save-outline" size={17} color={profileDirty ? '#fff' : colors.gray400} />
              <Text style={[styles.saveBtnText, { color: profileDirty ? '#fff' : colors.gray400 }]}>
                Enregistrer les modifications
              </Text>
            </TouchableOpacity>
          </SectionCard>

          {/* ── Security ── */}
          <SectionCard title="Sécurité" subtitle="Modifiez votre mot de passe de connexion" icon="lock-closed-outline">
            <Field
              label="Mot de passe actuel"
              value={currentPwd}
              onChange={setCurrentPwd}
              placeholder="••••••••"
              icon="lock-closed-outline"
              secureTextEntry={!showPwds}
            />
            <Field
              label="Nouveau mot de passe"
              value={newPwd}
              onChange={setNewPwd}
              placeholder="Min. 6 caractères"
              icon="lock-open-outline"
              secureTextEntry={!showPwds}
              hint={newPwd.length > 0 && newPwd.length < 6 ? 'Au moins 6 caractères requis.' : undefined}
            />
            <Field
              label="Confirmer le nouveau mot de passe"
              value={confirmPwd}
              onChange={setConfirmPwd}
              placeholder="••••••••"
              icon="checkmark-circle-outline"
              secureTextEntry={!showPwds}
            />

            {/* Show/hide toggle */}
            <Pressable
              style={styles.showPwdRow}
              onPress={() => setShowPwds(v => !v)}
            >
              <Ionicons
                name={showPwds ? 'eye-off-outline' : 'eye-outline'}
                size={15} color={colors.gray400}
              />
              <Text style={[styles.showPwdText, { color: colors.gray400 }]}>
                {showPwds ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
              </Text>
            </Pressable>

            {pwdMsg && <Toast message={pwdMsg.text} type={pwdMsg.type} />}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: pwdReady ? colors.primary : colors.gray200 },
              ]}
              onPress={handleSavePassword}
              disabled={!pwdReady}
              activeOpacity={0.85}
            >
              <Ionicons name="key-outline" size={17} color={pwdReady ? '#fff' : colors.gray400} />
              <Text style={[styles.saveBtnText, { color: pwdReady ? '#fff' : colors.gray400 }]}>
                Modifier le mot de passe
              </Text>
            </TouchableOpacity>
          </SectionCard>

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  pageHeader: {
    paddingHorizontal: Spacing.xl, height: 64,
    justifyContent: 'center', borderBottomWidth: 1,
  },
  pageTitle:    { ...Typography.h3 },
  pageSubtitle: { ...Typography.caption, marginTop: 2 },

  content: {
    padding: Spacing.xl, gap: Spacing.lg,
    maxWidth: 680, alignSelf: 'center', width: '100%',
  },

  // Profile summary card
  profileCard: {
    borderRadius: Radius.xl, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    padding: Spacing.lg, ...Shadow.sm,
  },
  avatarRing: {
    width: 76, height: 76, borderRadius: Radius.full,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatar: {
    width: 64, height: 64, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontSize: 24, fontWeight: '800' },
  profileMeta:  { flex: 1, gap: 3 },
  profileName:  { ...Typography.h4 },
  profileEmail: { ...Typography.bodySmall },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderRadius: Radius.full,
    paddingHorizontal: 9, paddingVertical: 3, marginTop: 4,
  },
  roleLabel: { ...Typography.caption, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 9,
    borderRadius: Radius.md, borderWidth: 1.5, flexShrink: 0,
  },
  logoutText: { ...Typography.bodySmall, fontWeight: '600' },

  // Section card
  sectionCard: {
    borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadow.sm,
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  sectionIconBox: {
    width: 36, height: 36, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sectionTitle: { ...Typography.h4 },
  sectionSub:   { ...Typography.caption, marginTop: 2 },
  sectionBody:  { padding: Spacing.lg, gap: Spacing.md },

  // Toast
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  toastText: { ...Typography.bodySmall, flex: 1, fontWeight: '500' },

  // Password helpers
  showPwdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  showPwdText: { ...Typography.caption },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 13, borderRadius: Radius.lg,
    marginTop: Spacing.xs,
  },
  saveBtnText: { ...Typography.body, fontWeight: '700' },
});
