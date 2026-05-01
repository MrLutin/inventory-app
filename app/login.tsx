import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, useColorScheme, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/store/auth';

// ─── Test accounts ───────────────────────────────────────────────────────────

const TEST_ACCOUNTS = [
  { label: 'Admin',       email: 'admin@mrlutin.dev', password: 'admin123', icon: 'shield-checkmark-outline' as const },
  { label: 'Utilisateur', email: 'user@mrlutin.dev',  password: 'user123',  icon: 'person-outline'           as const },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
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

  const dark = scheme === 'dark';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Logo ── */}
          <View style={styles.logoArea}>
            <View style={[styles.logoRing, { borderColor: colors.primary + '22' }]}>
              <View style={[styles.logoBox, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="cube" size={34} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.appName, { color: colors.black }]}>Capreit</Text>
            <Text style={[styles.appTagline, { color: colors.gray400 }]}>
              Gestion d'inventaire simplifiée
            </Text>
          </View>

          {/* ── Card ── */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.black }]}>Connexion</Text>
              <Text style={[styles.cardSub, { color: colors.gray400 }]}>
                Accédez à votre espace de gestion
              </Text>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.gray600 }]}>Adresse email</Text>
              <View style={[
                styles.inputRow,
                { borderColor: colors.border, backgroundColor: dark ? colors.gray100 : colors.gray50 },
                focused === 'email' && { borderColor: colors.primary, backgroundColor: colors.surface },
              ]}>
                <Ionicons
                  name="mail-outline" size={18}
                  color={focused === 'email' ? colors.primary : colors.gray400}
                />
                <TextInput
                  style={[styles.input, { color: colors.black }]}
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
              <Text style={[styles.fieldLabel, { color: colors.gray600 }]}>Mot de passe</Text>
              <View style={[
                styles.inputRow,
                { borderColor: colors.border, backgroundColor: dark ? colors.gray100 : colors.gray50 },
                focused === 'password' && { borderColor: colors.primary, backgroundColor: colors.surface },
              ]}>
                <Ionicons
                  name="lock-closed-outline" size={18}
                  color={focused === 'password' ? colors.primary : colors.gray400}
                />
                <TextInput
                  style={[styles.input, { color: colors.black }]}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showPwd}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={10}>
                  <Ionicons
                    name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                    size={18} color={colors.gray400}
                  />
                </TouchableOpacity>
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
              style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.75 }]}
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

          </View>

          {/* ── Test accounts ── */}
          <View style={styles.testSection}>
            <View style={styles.testDivider}>
              <View style={[styles.testLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.testLabel, { color: colors.gray400 }]}>Comptes de test</Text>
              <View style={[styles.testLine, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.testRow}>
              {TEST_ACCOUNTS.map(acc => {
                const isAdmin = acc.label === 'Admin';
                return (
                  <TouchableOpacity
                    key={acc.label}
                    style={[
                      styles.testChip,
                      {
                        backgroundColor: isAdmin ? colors.primaryBg : colors.gray100,
                        borderColor: isAdmin ? colors.primary + '40' : colors.border,
                      },
                    ]}
                    onPress={() => fillAccount(acc.email, acc.password)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={acc.icon} size={15}
                      color={isAdmin ? colors.primary : colors.gray600}
                    />
                    <View>
                      <Text style={[styles.testChipLabel, { color: isAdmin ? colors.primary : colors.gray600 }]}>
                        {acc.label}
                      </Text>
                      <Text style={[styles.testChipEmail, { color: colors.gray400 }]}>
                        {acc.email}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={[styles.footer, { color: colors.gray400 }]}>
            © 2026 Capreit
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav:  { flex: 1 },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },

  // Logo
  logoArea: { alignItems: 'center', gap: 10 },
  logoRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  logoBox: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  appTagline: { ...Typography.body },

  // Card
  card: {
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing.lg, gap: Spacing.md,
    ...Shadow.lg,
  },
  cardHeader: { gap: 4 },
  cardTitle: { ...Typography.h3 },
  cardSub:   { ...Typography.bodySmall },

  // Field
  field: { gap: 7 },
  fieldLabel: { ...Typography.bodySmall, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  input: { flex: 1, ...Typography.body, padding: 0 },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  errorText: { ...Typography.bodySmall, flex: 1 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 15, borderRadius: Radius.lg,
    marginTop: Spacing.xs, ...Shadow.sm,
  },
  submitText: { ...Typography.h4, color: '#fff' },

  // Test accounts
  testSection: { gap: Spacing.md },
  testDivider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  testLine: { flex: 1, height: 1 },
  testLabel: { ...Typography.caption, textTransform: 'uppercase', letterSpacing: 0.5 },
  testRow: { flexDirection: 'row', gap: Spacing.sm },
  testChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: Radius.lg, padding: 12,
  },
  testChipLabel: { ...Typography.bodySmall, fontWeight: '700' },
  testChipEmail: { ...Typography.caption, marginTop: 1 },

  footer: { ...Typography.caption, textAlign: 'center' },
});
