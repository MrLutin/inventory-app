import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  TextInput, ScrollView, Modal, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import { useAuth } from '@/store/auth';
import {
  fetchCategories,
  createCategoryDirectus,
  updateCategoryDirectus,
  deleteCategoryDirectus,
  DirectusCategory,
  CategoryPayload,
} from '@/lib/directusClient';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#F59E0B', '#84CC16', '#10B981',
  '#14B8A6', '#06B6D4', '#3B82F6', '#64748B',
];

/** Convertit un nom en slug lisible */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── ColorSwatch ──────────────────────────────────────────────────────────────

function ColorSwatch({ color }: { color: string | null | undefined }) {
  const colors = useColors();
  return (
    <View style={[
      swatchStyles.dot,
      { backgroundColor: color ?? colors.gray200, borderColor: color ? `${color}40` : colors.border },
    ]} />
  );
}

const swatchStyles = StyleSheet.create({
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
});

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: keyof typeof Ionicons.glyphMap;
  required?: boolean;
  hint?: string;
  keyboardType?: 'default' | 'url';
}

function Field({ label, value, onChange, placeholder, icon, required, hint, keyboardType = 'default' }: FieldProps) {
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
          style={[fStyles.input, { color: colors.black, outlineStyle: 'none' as any }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {hint && <Text style={[fStyles.hint, { color: colors.gray400 }]}>{hint}</Text>}
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
  hint:  { ...Typography.caption },
});

// ─── ColorPicker ─────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const colors  = useColors();
  const [custom, setCustom] = useState('');
  const [focused, setFocused] = useState(false);

  const applyCustom = () => {
    const hex = custom.trim().startsWith('#') ? custom.trim() : `#${custom.trim()}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) onChange(hex);
  };

  return (
    <View style={cpStyles.wrapper}>
      <Text style={[fStyles.label, { color: colors.gray600 }]}>Couleur</Text>

      {/* Swatches */}
      <View style={cpStyles.grid}>
        {COLOR_PALETTE.map(c => (
          <Pressable
            key={c}
            style={[
              cpStyles.swatch,
              { backgroundColor: c },
              value === c && cpStyles.swatchActive,
            ]}
            onPress={() => onChange(c)}
          >
            {value === c && (
              <Ionicons name="checkmark" size={13} color="#fff" />
            )}
          </Pressable>
        ))}
      </View>

      {/* Hex input */}
      <View style={[
        fStyles.row,
        { borderColor: colors.border, backgroundColor: colors.gray50, marginTop: 4 },
        focused && { borderColor: colors.primary, backgroundColor: colors.surface },
      ]}>
        <View style={[cpStyles.hexDot, { backgroundColor: value || colors.gray200 }]} />
        <TextInput
          style={[fStyles.input, { color: colors.black, outlineStyle: 'none' as any, fontFamily: 'monospace' as any }]}
          value={custom}
          onChangeText={setCustom}
          placeholder="Ex: #10B981"
          placeholderTextColor={colors.gray400}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); applyCustom(); }}
          onSubmitEditing={applyCustom}
        />
        {value && (
          <Text style={[cpStyles.hexLabel, { color: colors.gray600 }]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

const cpStyles = StyleSheet.create({
  wrapper:     { gap: 8 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 2.5, borderColor: 'rgba(0,0,0,0.25)',
    transform: [{ scale: 1.12 }],
  },
  hexDot:    { width: 18, height: 18, borderRadius: 9 },
  hexLabel:  { ...Typography.caption, fontFamily: 'monospace' as any },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WebCategoriesScreen() {
  const { add }     = useLocalSearchParams<{ add?: string }>();
  const colors      = useColors();
  const { isAdmin } = useAuth();

  const [categories, setCategories] = useState<DirectusCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [selected,   setSelected]   = useState<DirectusCategory | null>(null);
  const [hoveredId,  setHoveredId]  = useState<string | null>(null);

  const [name,  setName]  = useState('');
  const [slug,  setSlug]  = useState('');
  const [color, setColor] = useState('');
  const [slugManual, setSlugManual] = useState(false);

  const isEdit = selected !== null;

  // Auto-generate slug from name (unless user edited it manually)
  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleSlugChange = (v: string) => {
    setSlug(v);
    setSlugManual(v.length > 0);
  };

  // ── Data loading ──

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
    } catch (err: any) {
      globalThis.alert?.(`Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (add === '1') openAdd();
  }, []);

  // ── Modal helpers ──

  const openAdd = () => {
    setSelected(null);
    setName(''); setSlug(''); setColor(COLOR_PALETTE[0]); setSlugManual(false);
    setShowModal(true);
  };

  const openEdit = (cat: DirectusCategory) => {
    setSelected(cat);
    setName(cat.name);
    setSlug(cat.slug ?? '');
    setColor(cat.color ?? '');
    setSlugManual(true);
    setShowModal(true);
  };

  // ── CRUD ──

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      const payload: CategoryPayload = { name: name.trim() };
      if (slug.trim())  payload.slug  = slug.trim();
      if (color.trim()) payload.color = color.trim();
      if (isEdit) {
        await updateCategoryDirectus(String(selected.id), payload);
      } else {
        await createCategoryDirectus(payload);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      globalThis.alert?.(`Erreur : ${err.message}`);
    }
  };

  const handleDelete = async (cat: DirectusCategory) => {
    if (globalThis.confirm?.(`Supprimer la catégorie "${cat.name}" ?`)) {
      try {
        await deleteCategoryDirectus(String(cat.id));
        setShowModal(false);
        await load();
      } catch (err: any) {
        globalThis.alert?.(`Erreur : ${err.message}`);
      }
    }
  };

  // ── Render ──

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Page header ── */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.black }]}>Catégories</Text>
          <Text style={[styles.pageSubtitle, { color: colors.gray400 }]}>
            {categories.length} catégorie{categories.length > 1 ? 's' : ''} configurée{categories.length > 1 ? 's' : ''}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAdd}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Nouvelle catégorie</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Table ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.tableWrap}>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.gray400 }]}>Chargement…</Text>
            </View>
          ) : (
            <>
              {/* Table header */}
              <View style={[styles.tableHead, { backgroundColor: colors.gray50 }]}>
                <View style={styles.colColor} />
                <Text style={[styles.thCell, styles.colName,  { color: colors.gray400 }]}>Nom</Text>
                <Text style={[styles.thCell, styles.colSlug,  { color: colors.gray400 }]}>Slug</Text>
                <Text style={[styles.thCell, styles.colHex,   { color: colors.gray400 }]}>Couleur</Text>
                {isAdmin && <View style={styles.colActions} />}
              </View>

              {/* Rows */}
              {categories.map(cat => {
                const hovered = hoveredId === String(cat.id);
                return (
                  <Pressable
                    key={String(cat.id)}
                    style={[
                      styles.tableRow,
                      { borderBottomColor: colors.border },
                      hovered && { backgroundColor: `${colors.primary}08` },
                    ]}
                    onHoverIn={() => setHoveredId(String(cat.id))}
                    onHoverOut={() => setHoveredId(null)}
                    onPress={() => isAdmin && openEdit(cat)}
                  >
                    {/* Color dot */}
                    <View style={styles.colColor}>
                      <ColorSwatch color={cat.color} />
                    </View>

                    {/* Name */}
                    <View style={styles.colName}>
                      <Text style={[styles.cellPrimary, { color: colors.black }]}>{cat.name}</Text>
                    </View>

                    {/* Slug */}
                    <View style={styles.colSlug}>
                      <View style={[styles.slugPill, { backgroundColor: colors.gray100 }]}>
                        <Text style={[styles.slugText, { color: colors.gray600 }]}>
                          {cat.slug ?? '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Hex */}
                    <View style={styles.colHex}>
                      {cat.color ? (
                        <View style={styles.hexRow}>
                          <View style={[styles.hexDot, { backgroundColor: cat.color }]} />
                          <Text style={[styles.hexText, { color: colors.gray600 }]}>{cat.color}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.cellSecondary, { color: colors.gray400 }]}>—</Text>
                      )}
                    </View>

                    {/* Actions */}
                    {isAdmin && (
                      <View style={[styles.colActions, styles.actionsRow]}>
                        <Pressable
                          style={({ hovered: h }: any) => [
                            styles.actionBtn,
                            { backgroundColor: colors.gray100 },
                            h && { backgroundColor: colors.primaryBg },
                          ]}
                          onPress={e => { (e as any).stopPropagation?.(); openEdit(cat); }}
                        >
                          <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          style={({ hovered: h }: any) => [
                            styles.actionBtn,
                            { backgroundColor: colors.gray100 },
                            h && { backgroundColor: colors.dangerLight },
                          ]}
                          onPress={e => { (e as any).stopPropagation?.(); handleDelete(cat); }}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.danger} />
                        </Pressable>
                      </View>
                    )}
                  </Pressable>
                );
              })}

              {/* Empty state */}
              {categories.length === 0 && (
                <View style={[styles.emptyState, { borderColor: colors.border }]}>
                  <Ionicons name="pricetags-outline" size={40} color={colors.gray400} />
                  <Text style={[styles.emptyTitle, { color: colors.black }]}>Aucune catégorie</Text>
                  <Text style={[styles.emptyText, { color: colors.gray400 }]}>
                    Créez votre première catégorie pour organiser l'inventaire.
                  </Text>
                  {isAdmin && (
                    <TouchableOpacity
                      style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                      onPress={openAdd}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text style={styles.emptyBtnText}>Créer une catégorie</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Add / Edit modal ── */}
      {isAdmin && (
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowModal(false)} />

            <Pressable style={[styles.dialog, { backgroundColor: colors.surface }]} onPress={() => {}}>

              {/* Dialog header */}
              <View style={styles.dialogHeader}>
                <View style={[styles.dialogIconBox, { backgroundColor: colors.primaryBg }]}>
                  <Ionicons name="pricetag" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dialogTitle, { color: colors.black }]}>
                    {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                  </Text>
                  <Text style={[styles.dialogSub, { color: colors.gray400 }]}>
                    {isEdit ? selected?.name : 'Remplissez les informations ci-dessous'}
                  </Text>
                </View>
                <Pressable
                  style={[styles.closeBtn, { backgroundColor: colors.gray100 }]}
                  onPress={() => setShowModal(false)}
                >
                  <Ionicons name="close" size={18} color={colors.gray600} />
                </Pressable>
              </View>

              {/* Fields */}
              <View style={styles.fields}>
                <Field
                  label="Nom"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Ex: Électronique"
                  icon="text-outline"
                  required
                />
                <Field
                  label="Slug"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="Ex: electronique"
                  icon="link-outline"
                  hint="Identifiant URL généré automatiquement depuis le nom"
                />
                <ColorPicker value={color} onChange={setColor} />
              </View>

              {/* Delete (edit mode) */}
              {isEdit && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: colors.dangerLight, borderColor: '#FECACA' }]}
                  onPress={() => selected && handleDelete(selected)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Supprimer cette catégorie</Text>
                </TouchableOpacity>
              )}

              {/* Actions */}
              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.gray100 }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.gray600 }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }, !name.trim() && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={!name.trim()}
                >
                  <Ionicons name={isEdit ? 'save-outline' : 'checkmark'} size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Text>
                </TouchableOpacity>
              </View>

            </Pressable>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, height: 64, borderBottomWidth: 1,
  },
  pageTitle:    { ...Typography.h3 },
  pageSubtitle: { ...Typography.caption, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 9, borderRadius: Radius.md, ...Shadow.sm,
  },
  addBtnText: { ...Typography.bodySmall, color: '#fff', fontWeight: '700' },

  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: Spacing.sm },
  loadingText:      { ...Typography.body },

  // Table
  tableWrap: { padding: Spacing.xl },
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, marginBottom: 4,
  },
  thCell: { ...Typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderRadius: Radius.sm,
  },

  // Columns
  colColor:   { width: 44, alignItems: 'center' },
  colName:    { flex: 1.5, paddingRight: Spacing.md },
  colSlug:    { flex: 1.5, paddingRight: Spacing.md },
  colHex:     { flex: 1,   paddingRight: Spacing.md },
  colActions: { width: 80 },

  cellPrimary:   { ...Typography.body, fontWeight: '600' },
  cellSecondary: { ...Typography.bodySmall },

  slugPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  slugText: { ...Typography.caption, fontFamily: 'monospace' as any, fontWeight: '600' },

  hexRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  hexDot:  { width: 14, height: 14, borderRadius: 7 },
  hexText: { ...Typography.caption, fontFamily: 'monospace' as any },

  actionsRow: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  actionBtn: {
    width: 30, height: 30, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },

  emptyState: {
    alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 48, borderWidth: 1.5,
    borderStyle: 'dashed' as any, borderRadius: Radius.xl,
    marginTop: Spacing.md,
  },
  emptyTitle:   { ...Typography.h4, marginTop: Spacing.sm },
  emptyText:    { ...Typography.body, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radius.md, ...Shadow.sm,
  },
  emptyBtnText: { ...Typography.bodySmall, color: '#fff', fontWeight: '700' },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    width: '100%',
    maxWidth: 460,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.lg,
  },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dialogIconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dialogTitle: { ...Typography.h4 },
  dialogSub:   { ...Typography.caption, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  fields: { gap: Spacing.md },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 11, borderRadius: Radius.lg, borderWidth: 1,
  },
  deleteBtnText: { ...Typography.bodySmall, fontWeight: '700' },

  dialogActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.lg, alignItems: 'center' },
  cancelBtnText: { ...Typography.body, fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, ...Shadow.sm,
  },
  saveBtnText: { ...Typography.body, color: '#fff', fontWeight: '700' },
});
