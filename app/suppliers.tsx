import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import { useAuth } from '@/store/auth';
import {
  fetchSuppliers,
  createSupplierDirectus,
  updateSupplierDirectus,
  deleteSupplierDirectus,
  DirectusSupplierRef,
  SupplierPayload,
} from '@/lib/directusClient';

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  '#6366F1', '#10B981', '#F59E0B',
  '#EC4899', '#F97316', '#8B5CF6', '#06B6D4', '#14B8A6',
];

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

function getDomain(website: string | null | undefined): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

type LogoStep = 'clearbit' | 'google' | 'initials';

function SupplierLogo({ name, website, color }: { name: string; website?: string | null; color: string }) {
  const [step, setStep] = useState<LogoStep>('clearbit');
  const domain = getDomain(website);

  const src =
    domain && step === 'clearbit' ? `https://logo.clearbit.com/${domain}` :
    domain && step === 'google'   ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` :
    null;

  const handleError = () => {
    if (step === 'clearbit') setStep('google');
    else setStep('initials');
  };

  return (
    <View style={[styles.avatar, { backgroundColor: `${color}18` }]}>
      {src ? (
        <Image
          source={{ uri: src }}
          style={step === 'google' ? styles.logoFavicon : styles.logoImage}
          resizeMode="contain"
          onError={handleError}
        />
      ) : (
        <Text style={[styles.avatarText, { color }]}>{initials(name)}</Text>
      )}
    </View>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  icon: keyof typeof Ionicons.glyphMap;
  required?: boolean;
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default', icon, required }: FieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={fStyles.wrapper}>
      <Text style={[fStyles.label, { color: colors.gray600 }]}>
        {label}{required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <View style={[
        fStyles.row,
        { borderColor: colors.border, backgroundColor: colors.gray50 },
        focused && { borderColor: colors.primary, backgroundColor: colors.surface },
      ]}>
        <Ionicons name={icon} size={17} color={focused ? colors.primary : colors.gray400} />
        <TextInput
          style={[fStyles.input, { color: colors.black }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { ...Typography.bodySmall, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, ...Typography.body, padding: 0 },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SuppliersScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const colors = useColors();
  const [suppliers, setSuppliers] = useState<DirectusSupplierRef[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected,  setSelected]  = useState<DirectusSupplierRef | null>(null);

  const [name,    setName]    = useState('');
  const [website, setWebsite] = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');

  const isEdit = selected !== null;

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const openAdd = () => {
    setSelected(null);
    setName(''); setWebsite(''); setEmail(''); setPhone('');
    setShowModal(true);
  };

  const openEdit = (supplier: DirectusSupplierRef) => {
    setSelected(supplier);
    setName(supplier.name);
    setWebsite(supplier.website ?? '');
    setEmail(supplier.email ?? '');
    setPhone(supplier.phone ?? '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Le nom du fournisseur est obligatoire.');
      return;
    }
    try {
      const payload: SupplierPayload = { name: name.trim() };
      if (website.trim()) payload.website = website.trim();
      if (email.trim())   payload.email   = email.trim();
      if (phone.trim())   payload.phone   = phone.trim();
      if (isEdit) {
        await updateSupplierDirectus(String(selected.id), payload);
      } else {
        await createSupplierDirectus(payload);
      }
      setShowModal(false);
      await loadSuppliers();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    }
  };

  const handleDelete = () => {
    if (!selected) return;
    Alert.alert(
      'Supprimer le fournisseur',
      `Voulez-vous vraiment supprimer "${selected.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await deleteSupplierDirectus(String(selected.id));
            setShowModal(false);
            await loadSuppliers();
          } catch (err: any) {
            Alert.alert('Erreur', err.message);
          }
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.gray100 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.gray800} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.black }]}>Fournisseurs</Text>
        {isAdmin && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray400 }]}>Chargement…</Text>
        </View>
      ) : (
        /* List */
        <FlatList
          data={suppliers}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.count, { color: colors.gray400 }]}>
              {suppliers.length} fournisseur{suppliers.length > 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.gray400 }]}>Aucun fournisseur</Text>
          }
          renderItem={({ item, index }) => {
            const color = PALETTE[index % PALETTE.length];
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surface }]}
                activeOpacity={0.75}
                onPress={() => openEdit(item)}
              >
                <SupplierLogo name={item.name} website={item.website} color={color} />
                <View style={styles.cardContent}>
                  <Text style={[styles.cardName, { color: colors.black }]}>{item.name}</Text>
                  <Text style={[styles.cardContact, { color: colors.gray600 }]}>{item.website || '—'}</Text>
                  <Text style={[styles.cardEmail, { color: colors.gray400 }]}>{item.email || '—'}</Text>
                </View>
                <View style={styles.right}>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          ListFooterComponent={
            isAdmin ? (
              <TouchableOpacity
                style={[styles.addRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
                onPress={openAdd}
              >
                <View style={[styles.addIconBox, { backgroundColor: colors.primaryBg }]}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.addLabel, { color: colors.primary }]}>Ajouter un fournisseur</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={[styles.handle, { backgroundColor: colors.gray200 }]} />

              <View style={styles.sheetHeader}>
                <View style={[styles.sheetIconBox, { backgroundColor: colors.primaryBg }]}>
                  <Ionicons name="business" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetTitle, { color: colors.black }]}>
                    {isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                  </Text>
                  <Text style={[styles.sheetSub, { color: colors.gray400 }]}>
                    {isEdit ? selected?.name : 'Remplissez les informations ci-dessous'}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.gray100 }]} onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={18} color={colors.gray600} />
                </TouchableOpacity>
              </View>

              <View style={styles.fields}>
                <Field label="Nom" value={name} onChange={setName} placeholder="Ex: Apple France" icon="business-outline" required />
                <Field label="Site web" value={website} onChange={setWebsite} placeholder="https://example.com" icon="globe-outline" keyboardType="url" />
                <Field label="Email" value={email} onChange={setEmail} placeholder="Ex: pro@apple.fr" icon="mail-outline" keyboardType="email-address" />
                <Field label="Téléphone" value={phone} onChange={setPhone} placeholder="Ex: +33 1 00 00 00 00" icon="call-outline" keyboardType="phone-pad" />
              </View>

              {isEdit && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Supprimer ce fournisseur</Text>
                </TouchableOpacity>
              )}

              <View style={styles.sheetActions}>
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.gray100 }]} onPress={() => setShowModal(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.gray600 }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                  <Ionicons name={isEdit ? 'save-outline' : 'checkmark'} size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  topTitle: { ...Typography.h4 },
  addBtn: { width: 38, height: 38, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText: { ...Typography.body },

  list: { padding: Spacing.md, paddingBottom: 100 },
  count: { ...Typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, textAlign: 'center', marginTop: Spacing.xl },

  card: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 13, gap: Spacing.md },
  separator: { height: 1, marginLeft: 70 },
  avatar: { width: 42, height: 42, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  logoImage:   { width: 32, height: 32, borderRadius: 4 },
  logoFavicon: { width: 24, height: 24 },
  cardContent: { flex: 1, gap: 2 },
  cardName: { ...Typography.body, fontWeight: '600' },
  cardContact: { ...Typography.bodySmall },
  cardEmail: { ...Typography.caption },
  right: { alignItems: 'flex-end', gap: 4 },

  addRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 13, gap: Spacing.md, borderTopWidth: 1 },
  addIconBox: { width: 42, height: 42, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  addLabel: { ...Typography.body, fontWeight: '600' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.md, paddingBottom: 40, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: Spacing.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  sheetIconBox: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { ...Typography.h4 },
  sheetSub: { ...Typography.caption, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  fields: { gap: Spacing.md, marginBottom: Spacing.lg },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
  cancelBtnText: { ...Typography.h4 },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, ...Shadow.sm,
  },
  saveBtnText: { ...Typography.h4, color: '#fff' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 13, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#FECACA', marginBottom: Spacing.sm,
  },
  deleteBtnText: { ...Typography.body, fontWeight: '700' },
});
