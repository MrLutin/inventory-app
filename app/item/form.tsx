import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, SafeAreaView, StatusBar, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInventory } from '@/store/inventory';
import { useAuth } from '@/store/auth';
import { Category, CATEGORY_LABELS, InventoryItem } from '@/constants/data';
import { Colors, useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ['electronics', 'clothing', 'food', 'furniture', 'tools', 'other'];

const EMOJIS = [
  '📦','💻','📱','⌨️','🖥️','🖨️','📷','🎧','🔌','🔋',
  '👕','👗','👟','🧢','🧣','👜','🕶️','💍',
  '☕','🍎','🥐','🧃','🍕','🥫','🫙',
  '🪑','🛋️','🪵','🛏️','🚿','🪟',
  '🔧','🔨','⚙️','🪛','🔩','🪚','🔬','🧲',
  '📚','✏️','📋','🗂️','🖊️','📐',
];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, required, children, hint }: FieldProps) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.gray600 }]}>
        {label}{required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      {children}
      {hint && <Text style={[styles.fieldHint, { color: colors.gray400 }]}>{hint}</Text>}
    </View>
  );
}

interface StyledInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  maxLength?: number;
}

function StyledInput({ value, onChangeText, placeholder, keyboardType = 'default', multiline, maxLength }: StyledInputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        styles.input,
        { color: colors.black, borderColor: colors.border, backgroundColor: colors.gray50 },
        multiline && styles.inputMulti,
        focused && { borderColor: colors.primary, backgroundColor: colors.surface },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.gray400}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      maxLength={maxLength}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ItemFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getItem, addItem, updateItem } = useInventory();
  const colors = useColors();

  const { isAdmin } = useAuth();
  const existing = id ? getItem(id) : undefined;
  const isEdit = !!existing;

  useEffect(() => {
    if (!isAdmin) router.replace('/(tabs)');
  }, [isAdmin]);

  if (!isAdmin) return null;

  const [name,        setName]        = useState(existing?.name        ?? '');
  const [sku,         setSku]         = useState(existing?.sku         ?? '');
  const [barcode,     setBarcode]     = useState(existing?.barcode     ?? '');
  const [category,    setCategory]    = useState<Category>(existing?.category ?? 'other');
  const [quantity,    setQuantity]    = useState(existing?.quantity.toString()    ?? '0');
  const [minQuantity, setMinQuantity] = useState(existing?.minQuantity.toString() ?? '5');
  const [price,       setPrice]       = useState(existing?.price.toString()       ?? '0');
  const [location,    setLocation]    = useState(existing?.location    ?? '');
  const [supplier,    setSupplier]    = useState(existing?.supplier    ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [emoji,        setEmoji]        = useState(existing?.imageEmoji  ?? '📦');
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [showScanner,  setShowScanner]  = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Le nom de l\'article est obligatoire.');
      return;
    }
    setSaving(true);
    const fields = {
      name:        name.trim(),
      sku:         sku.trim(),
      barcode:     barcode.trim(),
      category,
      quantity:    parseInt(quantity)    || 0,
      minQuantity: parseInt(minQuantity) || 0,
      price:       parseFloat(price)     || 0,
      location:    location.trim(),
      supplier:    supplier.trim(),
      description: description.trim(),
      imageEmoji:  emoji,
    };
    if (isEdit && existing) {
      updateItem({ ...fields, id: existing.id, lastUpdated: new Date().toISOString().slice(0, 10) });
    } else {
      addItem(fields);
    }
    setSaving(false);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'article',
      `Voulez-vous vraiment supprimer "${existing?.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: () => { router.back(); },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Top bar */}
        <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.gray100 }]} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={colors.gray800} />
          </TouchableOpacity>
          <Text style={[styles.topTitle, { color: colors.black }]}>{isEdit ? 'Modifier' : 'Nouvel article'}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Emoji picker */}
          <View style={styles.emojiSection}>
            <TouchableOpacity
              style={[styles.emojiPicker, { backgroundColor: colors.gray100, borderColor: colors.border }]}
              onPress={() => setShowEmoji(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiDisplay}>{emoji}</Text>
              <View style={[styles.emojiEditBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="pencil" size={11} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.emojiHint, { color: colors.gray400 }]}>Appuyer pour changer l'icône</Text>
          </View>

          {showEmoji && (
            <View style={[styles.emojiGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiCell, emoji === e && { backgroundColor: colors.primaryBg }]}
                  onPress={() => { setEmoji(e); setShowEmoji(false); }}
                >
                  <Text style={styles.emojiCellText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Identification */}
          <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Identification</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Nom de l'article" required>
              <StyledInput value={name} onChangeText={setName} placeholder={'Ex: MacBook Pro 14"'} maxLength={80} />
            </Field>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <Field label="SKU" hint="Sera assigné automatiquement par l'API">
              <StyledInput value={sku} onChangeText={setSku} placeholder="Ex: APPL-MBP-14-001" maxLength={50} />
            </Field>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <Field label="Code-barres" hint="EAN-13, QR Code, Code 128…">
              <TouchableOpacity
                style={[
                  styles.scanField,
                  { borderColor: colors.border, backgroundColor: colors.gray50 },
                  barcode ? { borderColor: colors.primary, backgroundColor: colors.primaryBg } : null,
                ]}
                onPress={() => setShowScanner(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={barcode ? 'barcode' : 'scan-outline'}
                  size={20}
                  color={barcode ? colors.primary : colors.gray400}
                />
                <Text style={[styles.scanFieldText, { color: colors.gray400 }, barcode && { color: colors.black, fontWeight: '600' }]}>
                  {barcode || 'Appuyer pour scanner…'}
                </Text>
                {barcode ? (
                  <TouchableOpacity onPress={() => setBarcode('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.gray400} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
                )}
              </TouchableOpacity>
            </Field>
          </View>

          {/* Catégorie */}
          <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Catégorie</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  category === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.catLabel,
                  { color: colors.gray600 },
                  category === cat && { color: '#fff' },
                ]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stock */}
          <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Stock</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Quantité actuelle" required>
                  <StyledInput value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Quantité minimale" hint="Seuil d'alerte">
                  <StyledInput value={minQuantity} onChangeText={setMinQuantity} keyboardType="numeric" placeholder="5" />
                </Field>
              </View>
            </View>
          </View>

          {/* Finances & logistique */}
          <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Finances & logistique</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Prix unitaire (€)">
              <StyledInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" />
            </Field>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <Field label="Emplacement">
              <StyledInput value={location} onChangeText={setLocation} placeholder="Ex: Étagère A-01" />
            </Field>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <Field label="Fournisseur">
              <StyledInput value={supplier} onChangeText={setSupplier} placeholder="Ex: Apple France" />
            </Field>
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Description</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Description">
              <StyledInput
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez l'article…"
                multiline
                maxLength={300}
              />
            </Field>
          </View>

          {isEdit && (
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Supprimer l'article</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <BarcodeScannerModal
        visible={showScanner}
        onScanned={(code) => { setBarcode(code); setShowScanner(false); }}
        onClose={() => setShowScanner(false)}
      />
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
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.lg },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scroll: { padding: Spacing.md, gap: Spacing.sm },

  // Emoji
  emojiSection: { alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  emojiPicker: {
    width: 90, height: 90, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderStyle: 'dashed',
  },
  emojiDisplay: { fontSize: 46 },
  emojiEditBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 22, height: 22, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiHint: { ...Typography.caption },
  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.sm, gap: 4, ...Shadow.sm,
  },
  emojiCell: { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  emojiCellText: { fontSize: 24 },

  sectionTitle: {
    ...Typography.label, textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 4, marginTop: Spacing.sm,
  },

  card: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },

  field: { paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 10, gap: 6 },
  fieldLabel: { ...Typography.bodySmall, fontWeight: '600' },
  fieldHint: { ...Typography.caption },

  input: {
    ...Typography.body, borderWidth: 1.5, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  inputMulti: { height: 90, textAlignVertical: 'top', paddingTop: 10 },

  sep: { height: 1 },

  categoryRow: { paddingVertical: 4, gap: Spacing.sm },
  catChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1.5 },
  catLabel: { ...Typography.bodySmall, fontWeight: '600' },

  row2: { flexDirection: 'row', gap: 0 },

  scanField: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11,
  },
  scanFieldText: { flex: 1, ...Typography.body },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.md, paddingVertical: 14,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { ...Typography.body, fontWeight: '700' },
});
