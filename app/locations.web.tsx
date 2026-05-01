import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  TextInput, ScrollView, Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import { useAuth } from '@/store/auth';

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface Location {
  id: string;
  name: string;
  zone: string;
  description: string;
  itemCount: number;
  emoji: string;
}

const INITIAL_LOCATIONS: Location[] = [
  { id: '1', name: 'Étagère A',   zone: 'Zone principale', description: 'Étagères A-01 à A-05', itemCount: 3, emoji: '🗄️' },
  { id: '2', name: 'Étagère C-D', zone: 'Zone secondaire', description: 'Étagères C-05, D-02',  itemCount: 2, emoji: '📦' },
  { id: '3', name: 'Entrepôt B',  zone: 'Stockage lourd',  description: 'Baies B-08 à B-12',    itemCount: 2, emoji: '🏭' },
  { id: '4', name: 'Réserve F',   zone: 'Produits frais',  description: 'Zone réfrigérée F-01', itemCount: 1, emoji: '❄️' },
];

const ZONES  = ['Zone principale', 'Zone secondaire', 'Stockage lourd', 'Produits frais', 'Autre'];
const EMOJIS = ['🗄️','📦','🏭','❄️','🏪','🚪','🧺','📫','🪣','🛒','🏬','🗃️'];

type ZoneColor = { bg: string; text: string };

function getZoneColor(zone: string): ZoneColor {
  const map: Record<string, ZoneColor> = {
    'Zone principale':  { bg: '#EEF2FF', text: '#6366F1' },
    'Zone secondaire':  { bg: '#ECFDF5', text: '#10B981' },
    'Stockage lourd':   { bg: '#FFF7ED', text: '#F97316' },
    'Produits frais':   { bg: '#EFF6FF', text: '#3B82F6' },
    'Autre':            { bg: '#F1F5F9', text: '#64748B' },
  };
  return map[zone] ?? { bg: '#F1F5F9', text: '#64748B' };
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: keyof typeof Ionicons.glyphMap;
  required?: boolean;
}

function Field({ label, value, onChange, placeholder, icon, required }: FieldProps) {
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
        focused && { borderColor: '#F97316', backgroundColor: colors.surface },
      ]}>
        <Ionicons name={icon} size={17} color={focused ? '#F97316' : colors.gray400} />
        <TextInput
          style={[fStyles.input, { color: colors.black, outlineStyle: 'none' as any }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label:   { ...Typography.bodySmall, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, ...Typography.body, padding: 0 },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WebLocationsScreen() {
  const { add } = useLocalSearchParams<{ add?: string }>();
  const colors   = useColors();
  const { isAdmin } = useAuth();

  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [showModal, setShowModal] = useState(false);
  const [selected,  setSelected]  = useState<Location | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [zone,        setZone]        = useState(ZONES[0]);
  const [emoji,       setEmoji]       = useState('📦');

  const isEdit      = selected !== null;
  const totalItems  = locations.reduce((s, l) => s + l.itemCount, 0);

  // Auto-open form when navigating from sidebar with ?add=1
  useEffect(() => {
    if (add === '1') openAdd();
  }, []);

  const openAdd = () => {
    setSelected(null);
    setName(''); setDescription(''); setZone(ZONES[0]); setEmoji('📦');
    setShowModal(true);
  };

  const openEdit = (location: Location) => {
    setSelected(location);
    setName(location.name);
    setDescription(location.description);
    setZone(location.zone);
    setEmoji(location.emoji);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (isEdit) {
      setLocations(prev => prev.map(l =>
        l.id === selected.id
          ? { ...l, name: name.trim(), description: description.trim(), zone, emoji }
          : l
      ));
    } else {
      setLocations(prev => [
        { id: Date.now().toString(), name: name.trim(), description: description.trim(), zone, emoji, itemCount: 0 },
        ...prev,
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (location: Location) => {
    if (globalThis.confirm?.(`Supprimer l'emplacement "${location.name}" ?`)) {
      setLocations(prev => prev.filter(l => l.id !== location.id));
      setShowModal(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Page header ── */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.black }]}>Emplacements</Text>
          <Text style={[styles.pageSubtitle, { color: colors.gray400 }]}>
            {locations.length} emplacement{locations.length > 1 ? 's' : ''} · {totalItems} articles placés
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#F97316' }]}
            onPress={openAdd}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Nouvel emplacement</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Table ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.tableWrap}>

          {/* Stat cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.black }]}>{locations.length}</Text>
              <Text style={[styles.statLabel, { color: colors.gray400 }]}>Emplacements</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: '#F97316' }]}>{totalItems}</Text>
              <Text style={[styles.statLabel, { color: colors.gray400 }]}>Articles placés</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: '#6366F1' }]}>{ZONES.filter(z => locations.some(l => l.zone === z)).length}</Text>
              <Text style={[styles.statLabel, { color: colors.gray400 }]}>Zones actives</Text>
            </View>
          </View>

          {/* Table header */}
          <View style={[styles.tableHead, { backgroundColor: colors.gray50 }]}>
            <View style={styles.colEmoji} />
            <Text style={[styles.thCell, styles.colName,    { color: colors.gray400 }]}>Emplacement</Text>
            <Text style={[styles.thCell, styles.colZone,    { color: colors.gray400 }]}>Zone</Text>
            <Text style={[styles.thCell, styles.colDesc,    { color: colors.gray400 }]}>Description</Text>
            <Text style={[styles.thCell, styles.colCount,   { color: colors.gray400 }]}>Articles</Text>
            {isAdmin && <View style={styles.colActions} />}
          </View>

          {/* Rows */}
          {locations.map(item => {
            const zoneStyle = getZoneColor(item.zone);
            const hovered   = hoveredId === item.id;
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.border },
                  hovered && { backgroundColor: 'rgba(249,115,22,0.05)' },
                ]}
                onHoverIn={() => setHoveredId(item.id)}
                onHoverOut={() => setHoveredId(null)}
                onPress={() => isAdmin && openEdit(item)}
              >
                {/* Emoji */}
                <View style={styles.colEmoji}>
                  <View style={[styles.emojiBox, { backgroundColor: colors.gray100 }]}>
                    <Text style={styles.emojiText}>{item.emoji}</Text>
                  </View>
                </View>

                {/* Name */}
                <View style={styles.colName}>
                  <Text style={[styles.cellPrimary, { color: colors.black }]}>{item.name}</Text>
                </View>

                {/* Zone */}
                <View style={styles.colZone}>
                  <View style={[styles.zoneBadge, { backgroundColor: zoneStyle.bg }]}>
                    <Text style={[styles.zoneBadgeText, { color: zoneStyle.text }]}>{item.zone}</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.colDesc}>
                  <Text style={[styles.cellSecondary, { color: colors.gray600 }]}>
                    {item.description || '—'}
                  </Text>
                </View>

                {/* Articles count */}
                <View style={[styles.colCount, { alignItems: 'center' }]}>
                  <Text style={[styles.countText, { color: colors.black }]}>{item.itemCount}</Text>
                </View>

                {/* Actions */}
                {isAdmin && (
                  <View style={[styles.colActions, styles.actionsRow]}>
                    <Pressable
                      style={({ hovered: h }: any) => [
                        styles.actionBtn,
                        { backgroundColor: colors.gray100 },
                        h && { backgroundColor: '#FFF7ED' },
                      ]}
                      onPress={e => { (e as any).stopPropagation?.(); openEdit(item); }}
                    >
                      <Ionicons name="pencil-outline" size={15} color="#F97316" />
                    </Pressable>
                    <Pressable
                      style={({ hovered: h }: any) => [
                        styles.actionBtn,
                        { backgroundColor: colors.gray100 },
                        h && { backgroundColor: colors.dangerLight },
                      ]}
                      onPress={e => { (e as any).stopPropagation?.(); handleDelete(item); }}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </Pressable>
                  </View>
                )}
              </Pressable>
            );
          })}

          {/* Empty state */}
          {locations.length === 0 && (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={40} color={colors.gray400} />
              <Text style={[styles.emptyTitle, { color: colors.black }]}>Aucun emplacement</Text>
              <Text style={[styles.emptyText, { color: colors.gray400 }]}>
                Ajoutez votre premier emplacement.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Add / Edit modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowModal(false)} />

          <Pressable style={[styles.dialog, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Dialog header */}
              <View style={styles.dialogHeader}>
                <View style={styles.dialogIconBox}>
                  <Ionicons name="location" size={22} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dialogTitle, { color: colors.black }]}>
                    {isEdit ? "Modifier l'emplacement" : 'Nouvel emplacement'}
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

              {/* Emoji picker */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.groupLabel, { color: colors.gray600 }]}>Icône</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
                  {EMOJIS.map(e => (
                    <Pressable
                      key={e}
                      style={[
                        styles.emojiCell,
                        { backgroundColor: colors.gray100 },
                        emoji === e && { backgroundColor: '#FFF7ED', borderWidth: 2, borderColor: '#F97316' },
                      ]}
                      onPress={() => setEmoji(e)}
                    >
                      <Text style={styles.emojiCellText}>{e}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Fields */}
              <View style={styles.fields}>
                <Field label="Nom"         value={name}        onChange={setName}        placeholder="Ex: Étagère A"           icon="location-outline"      required />
                <Field label="Description" value={description} onChange={setDescription} placeholder="Ex: Étagères A-01 à A-05" icon="document-text-outline"          />
              </View>

              {/* Zone selector */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.groupLabel, { color: colors.gray600 }]}>
                  Type de zone <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={styles.zoneGrid}>
                  {ZONES.map(z => {
                    const zs     = getZoneColor(z);
                    const active = zone === z;
                    return (
                      <Pressable
                        key={z}
                        style={[
                          styles.zoneChip,
                          { backgroundColor: colors.gray100, borderColor: colors.border },
                          active && { backgroundColor: zs.bg, borderColor: zs.text },
                        ]}
                        onPress={() => setZone(z)}
                      >
                        <Text style={[styles.zoneChipText, { color: colors.gray600 }, active && { color: zs.text }]}>
                          {z}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Delete (edit mode) */}
              {isEdit && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: colors.dangerLight, borderColor: '#FECACA' }]}
                  onPress={() => selected && handleDelete(selected)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Supprimer cet emplacement</Text>
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
                  style={[styles.saveBtn, { backgroundColor: '#F97316' }, !name.trim() && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={!name.trim()}
                >
                  <Ionicons name={isEdit ? 'save-outline' : 'checkmark'} size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </Pressable>
        </View>
      </Modal>
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

  // Stats
  tableWrap: { padding: Spacing.xl, gap: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1, borderRadius: Radius.lg, borderWidth: 1,
    paddingVertical: Spacing.md, alignItems: 'center', gap: 4, ...Shadow.sm,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { ...Typography.caption },

  // Table
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
  colEmoji:   { width: 52, alignItems: 'center' },
  colName:    { flex: 1.2, paddingRight: Spacing.md },
  colZone:    { flex: 1.5, paddingRight: Spacing.md },
  colDesc:    { flex: 2,   paddingRight: Spacing.md },
  colCount:   { width: 80 },
  colActions: { width: 80 },

  emojiBox:  { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },

  cellPrimary:   { ...Typography.body, fontWeight: '600' },
  cellSecondary: { ...Typography.bodySmall },

  zoneBadge:     { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  zoneBadgeText: { ...Typography.caption, fontWeight: '600' },

  countText: { fontSize: 18, fontWeight: '800' },

  actionsRow: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  actionBtn: {
    width: 30, height: 30, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },

  emptyState: {
    alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 48, borderWidth: 1.5,
    borderStyle: 'dashed' as any, borderRadius: Radius.xl,
  },
  emptyTitle: { ...Typography.h4, marginTop: Spacing.sm },
  emptyText:  { ...Typography.body },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '85%' as any,
    ...Shadow.lg,
  },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  dialogIconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dialogTitle: { ...Typography.h4 },
  dialogSub:   { ...Typography.caption, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  fieldGroup: { gap: 8, marginBottom: Spacing.md },
  groupLabel: { ...Typography.bodySmall, fontWeight: '600' },
  emojiRow:   { gap: Spacing.sm, paddingVertical: 4 },
  emojiCell:  { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  emojiCellText: { fontSize: 22 },

  fields: { gap: Spacing.md, marginBottom: Spacing.md },

  zoneGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  zoneChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5 },
  zoneChipText: { ...Typography.bodySmall, fontWeight: '600' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 11, borderRadius: Radius.lg, borderWidth: 1,
    marginTop: Spacing.sm, marginBottom: Spacing.sm,
  },
  deleteBtnText: { ...Typography.bodySmall, fontWeight: '700' },

  dialogActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.lg, alignItems: 'center' },
  cancelBtnText: { ...Typography.body, fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, ...Shadow.sm,
  },
  saveBtnText: { ...Typography.body, color: '#fff', fontWeight: '700' },
});
