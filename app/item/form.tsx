import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, SafeAreaView, StatusBar, Alert,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInventory } from '@/store/inventory';
import { useAuth } from '@/store/auth';
import { InventoryItem } from '@/constants/data';
import { getImageUrl, fetchCategories, fetchSuppliers, fetchLocations, DirectusCategory, DirectusSupplierRef, DirectusLocationRef } from '@/lib/directusClient';
import { Colors, useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

// ─── Constants ───────────────────────────────────────────────────────────────

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

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {}); // silently ignore if not set up yet
  }, []);

  useEffect(() => {
    fetchSuppliers().then(setSuppliers).catch(() => {});
    fetchLocations().then(setAvailableLocations).catch(() => {});
  }, []);

  if (!isAdmin) return null;

  const [name,         setName]         = useState(existing?.name         ?? '');
  // SKU est généré automatiquement par Directus (UUID) — lecture seule
  const sku = existing?.sku ?? null;
  const [barcode,      setBarcode]      = useState(existing?.barcode      ?? '');
  const [supplierCode, setSupplierCode] = useState(existing?.supplierCode ?? '');
  const [categories,  setCategories]  = useState<DirectusCategory[]>([]);
  const [category,      setCategory]      = useState<string>(existing?.category      ?? '');
  const [categoryId,    setCategoryId]    = useState<string | null>(existing?.categoryId    ?? null);
  const [categoryColor, setCategoryColor] = useState<string | null>(existing?.categoryColor ?? null);

  const [suppliers,       setSuppliers]       = useState<DirectusSupplierRef[]>([]);
  const [supplierId,      setSupplierId]      = useState<string | null>(existing?.supplier?.id ?? null);
  const [supplierName,    setSupplierName]    = useState<string>(existing?.supplier?.name ?? '');

  const [availableLocations, setAvailableLocations] = useState<DirectusLocationRef[]>([]);

  // Map locId → { quantity, junctionId? }
  type SelLocEntry = { quantity: number; junctionId?: string };
  const [selectedLocs, setSelectedLocs] = useState<Record<string, SelLocEntry>>(
    Object.fromEntries(
      (existing?.locations ?? []).map(l => [l.id, { quantity: l.quantity ?? 0, junctionId: l.junctionId }])
    )
  );

  const [minQuantity, setMinQuantity] = useState(existing?.minQuantity.toString() ?? '5');
  const [price,       setPrice]       = useState(existing?.price.toString()       ?? '0');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [imageUuid,   setImageUuid]   = useState<string | null>(existing?.image ?? null);
  const [showScanner, setShowScanner] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleLocation = (locId: string) => {
    setSelectedLocs(prev => {
      const next = { ...prev };
      if (next[locId]) {
        delete next[locId];
      } else {
        next[locId] = { quantity: 0 };
      }
      return next;
    });
  };

  const setLocQty = (locId: string, qty: number) => {
    setSelectedLocs(prev => ({
      ...prev,
      [locId]: { ...prev[locId], quantity: qty },
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Le nom de l\'article est obligatoire.');
      return;
    }
    setSaving(true);

    // Locations sélectionnées
    const locations = Object.entries(selectedLocs).map(([locId, { quantity, junctionId }]) => {
      const loc = availableLocations.find(l => String(l.id) === locId);
      return {
        id: locId,
        name: loc?.name ?? '',
        zone: loc?.zone ?? undefined,
        quantity,
        junctionId,
      };
    });

    // Junction rows à supprimer (existaient avant, maintenant désélectionnés)
    const locationsToDelete = (existing?.locations ?? [])
      .filter(l => l.junctionId && !selectedLocs[l.id])
      .map(l => l.junctionId!);

    const fields = {
      name:        name.trim(),
      // sku omis — généré automatiquement par Directus
      barcode:      barcode.trim(),
      supplierCode: supplierCode.trim() || null,
      category,
      categoryId,
      categoryColor,
      quantity:    locations.reduce((s, l) => s + (l.quantity ?? 0), 0),
      minQuantity: parseInt(minQuantity) || 0,
      price:       parseFloat(price) || 0,
      locations,
      supplier:    supplierId ? { id: supplierId, name: supplierName } : null,
      description: description.trim(),
      image:       imageUuid,
    };
    try {
      if (isEdit && existing) {
        await updateItem({ ...fields, id: existing.id, lastUpdated: new Date().toISOString().slice(0, 10) }, locationsToDelete);
      } else {
        await addItem(fields);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Impossible de sauvegarder l\'article.');
    } finally {
      setSaving(false);
    }
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
          {/* Image */}
          <View style={styles.imageSection}>
            <View style={[styles.imagePicker, { backgroundColor: colors.gray100, borderColor: colors.border }]}>
              {getImageUrl(imageUuid)
                ? <Image source={{ uri: getImageUrl(imageUuid)! }} style={styles.imagePreview} resizeMode="cover" />
                : <Ionicons name="image-outline" size={36} color={colors.gray400} />
              }
            </View>
            <View style={{ width: '100%', gap: 6 }}>
              <Text style={[styles.imageHint, { color: colors.gray600, fontWeight: '600' }]}>UUID fichier Directus</Text>
              <StyledInput
                value={imageUuid ?? ''}
                onChangeText={v => setImageUuid(v.trim() || null)}
                placeholder="Ex: 4a3c8f12-…"
              />
              {imageUuid && (
                <TouchableOpacity onPress={() => setImageUuid(null)}>
                  <Text style={[styles.imageRemove, { color: colors.danger }]}>Supprimer l'image</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Identification */}
          <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Identification</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Nom de l'article" required>
              <StyledInput value={name} onChangeText={setName} placeholder={'Ex: MacBook Pro 14"'} maxLength={80} />
            </Field>
            {sku && (
              <>
                <View style={[styles.sep, { backgroundColor: colors.border }]} />
                <Field label="SKU" hint="Identifiant unique généré automatiquement">
                  <View style={[styles.skuBox, { backgroundColor: colors.gray100, borderColor: colors.border }]}>
                    <Ionicons name="key-outline" size={15} color={colors.gray400} />
                    <Text style={[styles.skuText, { color: colors.gray600 }]} numberOfLines={1}>{sku}</Text>
                  </View>
                </Field>
              </>
            )}
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <Field label="Code-barres" hint="EAN-13, QR Code, Code 128…">
              {Platform.OS === 'web' ? (
                <StyledInput
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="Ex: 0194253387558"
                />
              ) : (
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
              )}
            </Field>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <Field label="Code Fournisseur" hint="Référence produit chez le fournisseur">
              <StyledInput
                value={supplierCode}
                onChangeText={setSupplierCode}
                placeholder="Ex: AP-MBP14-M3PRO"
                maxLength={80}
              />
            </Field>
          </View>

          {/* Catégorie */}
          {categories.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Catégorie</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {categories.map(cat => {
                  const isActive = categoryId === String(cat.id);
                  return (
                    <TouchableOpacity
                      key={String(cat.id)}
                      style={[
                        styles.catChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => { setCategory(cat.name); setCategoryId(String(cat.id)); setCategoryColor(cat.color ?? null); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.catLabel,
                        { color: colors.gray600 },
                        isActive && { color: '#fff' },
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Fournisseur */}
          {suppliers.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Fournisseur</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {/* Chip "Aucun" */}
                <TouchableOpacity
                  style={[styles.catChip, { backgroundColor: colors.surface, borderColor: colors.border }, !supplierId && { backgroundColor: colors.gray200, borderColor: colors.gray200 }]}
                  onPress={() => { setSupplierId(null); setSupplierName(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catLabel, { color: colors.gray600 }, !supplierId && { color: colors.gray800 }]}>Aucun</Text>
                </TouchableOpacity>
                {suppliers.map(s => {
                  const isActive = supplierId === String(s.id);
                  return (
                    <TouchableOpacity
                      key={String(s.id)}
                      style={[styles.catChip, { backgroundColor: colors.surface, borderColor: colors.border }, isActive && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => { setSupplierId(String(s.id)); setSupplierName(s.name); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.catLabel, { color: colors.gray600 }, isActive && { color: '#fff' }]}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Emplacements */}
          {availableLocations.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Emplacements</Text>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {availableLocations.map((loc, idx) => {
                  const locId   = String(loc.id);
                  const sel     = selectedLocs[locId];
                  const isActive = !!sel;
                  return (
                    <React.Fragment key={locId}>
                      {idx > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                      <View style={styles.locRow}>
                        {/* Zone cliquable : checkbox + nom/zone uniquement */}
                        <TouchableOpacity
                          style={styles.locToggle}
                          onPress={() => toggleLocation(locId)}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.locCheck,
                            { borderColor: colors.border, backgroundColor: colors.gray50 },
                            isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}>
                            {isActive && <Ionicons name="checkmark" size={13} color="#fff" />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.locName, { color: colors.black }]}>{loc.name}</Text>
                            {loc.zone && <Text style={[styles.locZone, { color: colors.gray400 }]}>{loc.zone}</Text>}
                          </View>
                        </TouchableOpacity>
                        {/* Input quantité en dehors du TouchableOpacity */}
                        {isActive && (
                          <TextInput
                            style={[styles.locQtyInput, { color: colors.black, borderColor: colors.primary, backgroundColor: colors.primaryBg }]}
                            value={String(sel.quantity)}
                            onChangeText={v => setLocQty(locId, parseInt(v) || 0)}
                            keyboardType="numeric"
                          />
                        )}
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            </>
          )}

          {/* Stock — quantité minimale */}
          <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Stock</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Quantité minimale" hint="Seuil d'alerte stock faible">
              <StyledInput value={minQuantity} onChangeText={setMinQuantity} keyboardType="numeric" placeholder="5" />
            </Field>
          </View>

          {/* Finances */}
          <Text style={[styles.sectionTitle, { color: colors.gray400 }]}>Finances</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Prix unitaire ($)">
              <StyledInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" />
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

  // Image
  imageSection: { alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  imagePicker: {
    width: 100, height: 100, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderStyle: 'dashed', overflow: 'hidden',
  },
  imagePreview: { width: 100, height: 100 },
  imageEditBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 22, height: 22, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  imageHint: { ...Typography.caption },
  imageRemove: { ...Typography.caption, fontWeight: '600' },

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

  skuBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
  },
  skuText: { ...Typography.bodySmall, fontFamily: 'monospace' as any, flex: 1 },

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

  locRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    gap: Spacing.md,
  },
  locToggle: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    flex: 1,
  },
  locCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  locName: { ...Typography.body, fontWeight: '600' },
  locZone: { ...Typography.caption, marginTop: 1 },
  locQtyInput: {
    width: 64, textAlign: 'center', borderWidth: 1.5, borderRadius: Radius.md,
    paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, fontWeight: '700',
  },
});
