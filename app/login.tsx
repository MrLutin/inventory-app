import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/store/auth';

export default function LoginScreen() {
  const colors   = useColors();
  const scheme   = useColorScheme();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focusedField, setFocused] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setError(result.error ?? 'Erreur inconnue.');
  };

  const s = makeStyles(colors, scheme === 'dark');

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Logo / branding */}
        <View style={s.hero}>
          <View style={s.logoBox}>
            <Text style={s.logoEmoji}>📦</Text>
          </View>
          <Text style={s.appName}>Inventory</Text>
          <Text style={s.appSub}>Gestion de stock simplifiée</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Connexion</Text>

          {/* Email */}
          <View style={s.fieldWrapper}>
            <Text style={s.fieldLabel}>Adresse email</Text>
            <View style={[s.inputRow, focusedField === 'email' && s.inputRowFocused]}>
              <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? colors.primary : colors.gray400} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                placeholder="admin@mrlutin.dev"
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
          <View style={s.fieldWrapper}>
            <Text style={s.fieldLabel}>Mot de passe</Text>
            <View style={[s.inputRow, focusedField === 'password' && s.inputRowFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? colors.primary : colors.gray400} />
              <TextInput
                style={s.input}
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
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={8}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
              <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity style={s.submitBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={s.submitText}>Se connecter</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Test accounts hint */}
        <View style={s.hint}>
          <Text style={s.hintTitle}>Comptes de test</Text>
          <View style={s.hintRow}>
            <TouchableOpacity style={s.hintChip} onPress={() => { setEmail('admin@mrlutin.dev'); setPassword('admin123'); setError(''); }}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.primary} />
              <Text style={[s.hintChipText, { color: colors.primary }]}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.hintChip, { backgroundColor: colors.gray100 }]} onPress={() => { setEmail('user@mrlutin.dev'); setPassword('user123'); setError(''); }}>
              <Ionicons name="person-outline" size={13} color={colors.gray600} />
              <Text style={[s.hintChipText, { color: colors.gray600 }]}>Utilisateur</Text>
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, dark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    kav: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.md, gap: Spacing.lg },

    // Hero
    hero: { alignItems: 'center', gap: Spacing.sm },
    logoBox: {
      width: 80, height: 80, borderRadius: Radius.xl,
      backgroundColor: colors.primaryBg,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: colors.primary + '40',
      ...Shadow.md,
    },
    logoEmoji: { fontSize: 38 },
    appName: { ...Typography.h1, color: colors.black },
    appSub: { ...Typography.body, color: colors.gray400 },

    // Card
    card: {
      backgroundColor: colors.surface, borderRadius: Radius.xl,
      padding: Spacing.lg, gap: Spacing.md,
      borderWidth: 1, borderColor: colors.border, ...Shadow.lg,
    },
    cardTitle: { ...Typography.h3, color: colors.black, marginBottom: Spacing.xs },

    // Field
    fieldWrapper: { gap: 6 },
    fieldLabel: { ...Typography.bodySmall, fontWeight: '600', color: colors.gray600 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      borderWidth: 1.5, borderColor: colors.border, borderRadius: Radius.md,
      paddingHorizontal: 14, paddingVertical: 12,
      backgroundColor: dark ? colors.gray50 : '#F8FAFC',
    },
    inputRowFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
    input: { flex: 1, ...Typography.body, color: colors.black, padding: 0 },

    // Error
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.dangerLight, borderRadius: Radius.md,
      paddingHorizontal: Spacing.md, paddingVertical: 10,
    },
    errorText: { ...Typography.bodySmall, flex: 1 },

    // Submit
    submitBtn: {
      backgroundColor: colors.primary, borderRadius: Radius.lg,
      paddingVertical: 14, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      marginTop: Spacing.xs, ...Shadow.sm,
    },
    submitText: { ...Typography.h4, color: '#fff' },

    // Hint
    hint: { alignItems: 'center', gap: Spacing.sm },
    hintTitle: { ...Typography.caption, color: colors.gray400, textTransform: 'uppercase', letterSpacing: 0.5 },
    hintRow: { flexDirection: 'row', gap: Spacing.sm },
    hintChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.primaryBg, borderRadius: Radius.full,
      paddingHorizontal: 14, paddingVertical: 8,
    },
    hintChipText: { ...Typography.bodySmall, fontWeight: '600' },
  });
}
