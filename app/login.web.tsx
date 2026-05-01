import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Pressable, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/store/auth';

// ─── Feature list (left panel) ───────────────────────────────────────────────

const FEATURES = [
  { icon: 'cube-outline'        as const, label: 'Gestion d\'inventaire en temps réel' },
  { icon: 'scan-outline'        as const, label: 'Scan de codes-barres intégré' },
  { icon: 'people-outline'      as const, label: 'Multi-utilisateurs avec rôles' },
  { icon: 'moon-outline'        as const, label: 'Dark mode & thème système' },
  { icon: 'globe-outline'       as const, label: 'Web, iOS et Android' },
];

// ─── Test accounts ───────────────────────────────────────────────────────────

const TEST_ACCOUNTS = [
  { label: 'Admin',       email: 'admin@mrlutin.dev', password: 'admin123', icon: 'shield-checkmark-outline' as const, color: Colors.primary },
  { label: 'Utilisateur', email: 'user@mrlutin.dev',  password: 'user123',  icon: 'person-outline'           as const, color: Colors.gray600  },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WebLoginScreen() {
  const colors = useColors();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) setError(result.error ?? 'Identifiants incorrects.');
  };

  const fillAccount = (e: string, p: string) => {
    setEmail(e); setPassword(p); setError('');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ══════════════════════════════════════════
          LEFT — Branded panel
      ══════════════════════════════════════════ */}
      <View style={[styles.left, { backgroundColor: colors.primary }]}>

        {/* Decorative circles */}
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        {/* Logo */}
        <View style={styles.leftContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="cube" size={28} color={colors.primary} />
            </View>
            <Text style={styles.logoText}>Capreit</Text>
          </View>

          {/* Hero text */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Gérez votre inventaire{'\n'}efficacement.
            </Text>
            <Text style={styles.heroSub}>
              Une plateforme complète pour piloter votre stock, vos fournisseurs et vos emplacements.
            </Text>
          </View>

          {/* Feature list */}
          <View style={styles.featureList}>
            {FEATURES.map(f => (
              <View key={f.label} style={styles.featureRow}>
                <View style={styles.featureIconBox}>
                  <Ionicons name={f.icon} size={16} color={colors.primary} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.leftFooter}>© 2026 Capreit · Tous droits réservés</Text>
      </View>

      {/* ══════════════════════════════════════════
          RIGHT — Login form
      ══════════════════════════════════════════ */}
      <View style={[styles.right, { backgroundColor: colors.background }]}>
        <View style={styles.formContainer}>

          {/* Header */}
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: colors.black }]}>Bienvenue 👋</Text>
            <Text style={[styles.formSub, { color: colors.gray400 }]}>
              Connectez-vous pour accéder à votre espace.
            </Text>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.gray600 }]}>Adresse email</Text>
            <View style={[
              styles.inputRow,
              { borderColor: colors.border, backgroundColor: colors.surface },
              focused === 'email' && { borderColor: colors.primary, backgroundColor: colors.surface },
            ]}>
              <Ionicons
                name="mail-outline" size={17}
                color={focused === 'email' ? colors.primary : colors.gray400}
              />
              <TextInput
                style={[styles.input, { color: colors.black, outlineStyle: 'none' as any }]}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                placeholder="vous@example.com"
                placeholderTextColor={colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.fieldLabel, { color: colors.gray600 }]}>Mot de passe</Text>
            </View>
            <View style={[
              styles.inputRow,
              { borderColor: colors.border, backgroundColor: colors.surface },
              focused === 'password' && { borderColor: colors.primary },
            ]}>
              <Ionicons
                name="lock-closed-outline" size={17}
                color={focused === 'password' ? colors.primary : colors.gray400}
              />
              <TextInput
                style={[styles.input, { color: colors.black, outlineStyle: 'none' as any }]}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder="••••••••"
                placeholderTextColor={colors.gray400}
                secureTextEntry={!showPwd}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                  size={17} color={colors.gray400}
                />
              </Pressable>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={styles.submitText}>Se connecter</Text>
                </>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.gray400 }]}>Comptes de test</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Test accounts */}
          <View style={styles.testRow}>
            {TEST_ACCOUNTS.map(acc => (
              <Pressable
                key={acc.label}
                style={({ hovered }: any) => [
                  styles.testChip,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  hovered && { borderColor: acc.color, backgroundColor: `${acc.color}0D` },
                ]}
                onPress={() => fillAccount(acc.email, acc.password)}
              >
                <Ionicons name={acc.icon} size={14} color={acc.color} />
                <View>
                  <Text style={[styles.testChipLabel, { color: acc.color }]}>{acc.label}</Text>
                  <Text style={[styles.testChipEmail, { color: colors.gray400 }]}>{acc.email}</Text>
                </View>
              </Pressable>
            ))}
          </View>

        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', minHeight: '100vh' as any },

  // ── Left panel ──
  left: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  decCircle1: {
    position: 'absolute', width: 400, height: 400,
    borderRadius: 200, backgroundColor: 'rgba(255,255,255,0.06)',
    top: -100, right: -100,
  },
  decCircle2: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -80, left: -60,
  },

  leftContent: { flex: 1, justifyContent: 'center', gap: 40, zIndex: 1 },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },

  heroSection: { gap: 12 },
  heroTitle: {
    fontSize: 36, fontWeight: '800', color: '#fff',
    lineHeight: 44, letterSpacing: -0.8,
  },
  heroSub: {
    fontSize: 16, color: 'rgba(255,255,255,0.70)',
    lineHeight: 24, fontWeight: '400',
  },

  featureList: { gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIconBox: {
    width: 30, height: 30, borderRadius: Radius.sm,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  leftFooter: { fontSize: 12, color: 'rgba(255,255,255,0.4)', zIndex: 1 },

  // ── Right panel ──
  right: {
    width: 480, flexShrink: 0,
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xl,
  },
  formContainer: { width: '100%', maxWidth: 400, gap: Spacing.md },

  formHeader: { gap: 6, marginBottom: Spacing.sm },
  formTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  formSub:   { ...Typography.body, lineHeight: 22 },

  // Fields
  field: { gap: 7 },
  fieldLabel: { ...Typography.bodySmall, fontWeight: '600' },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, ...Typography.body, padding: 0 },
  eyeBtn: { padding: 2 },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  errorText: { ...Typography.bodySmall, flex: 1 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.lg,
    marginTop: Spacing.xs, ...Shadow.sm,
  },
  submitText: { ...Typography.h4, color: '#fff' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xs },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { ...Typography.caption },

  // Test accounts
  testRow: { flexDirection: 'row', gap: Spacing.sm },
  testChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: Radius.md, padding: 12,
  },
  testChipLabel: { ...Typography.bodySmall, fontWeight: '700' },
  testChipEmail: { ...Typography.caption, marginTop: 1 },
});
