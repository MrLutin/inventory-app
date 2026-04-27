import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing, Radius, Shadow, Typography } from '@/constants/theme';
import { useAuth } from '@/store/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Location {
  id: string;
  name: string;
  zone: string;
  description: string;
  itemCount: number;
  emoji: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INITIAL_LOCATIONS: Location[] = [
  { id: '1', name: 'Étagère A',   zone: 'Zone principale', description: 'Étagères A-01 à A-05', itemCount: 3, emoji: '🗄️' },
  { id: '2', name: 'Étagère C-D', zone: 'Zone secondaire', description: 'Étagères C-05, D-02',  itemCount: 2, emoji: '📦' },
  { id: '3', name: 'Entrepôt B',  zone: 'Stockage lourd',  description: 'Baies B-08 à B-12',    itemCount: 2, emoji: '🏭' },
  { id: '4', name: 'Réserve F',   zone: 'Produits frais',  description: 'Zone réfrigérée F-01', itemCount: 1, emoji: '❄️' },
];

const ZONES = ['Zone principale', 'Zone secondaire', 'Stockage lourd', 'Produits frais', 'Autre'];
const EMOJIS = ['🗄️','📦','🏭','❄️','🏪','🚪','🧺','📫','🪣','🛒','🏬','🗃️'];

// Zone colors that work for both themes (using fixed semantic colors, not theme-dependant)
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
        focused && { borderColor: colors.primary, backgroundColor: colors.surface },
      ]}>
        <Ionicons name={icon} size={17} color={focused ? colors.primary : colors.gray400} />
        <TextInput
          style={[fStyles.input, { color: colors.black }]}
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
  label: { ...Typography.bodySmall, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, ...Typography.body, padding: 0 },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LocationsScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const colors = useColors();
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [showModal, setShowModal] = useState(false);
  const [selected,  setSelected]  = useState<Location | null>(null);

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [zone,        setZone]        = useState(ZONES[0]);
  const [emoji,       setEmoji]       = useState('📦');

  const totalItems = locations.reduce((s, l) => s + l.itemCount, 0);
  const isEdit = selected !== null;

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
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Le nom de l\'emplacement est obligatoire.');
      return;
    }
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

  const handleDelete = () => {
    if (!selected) return;
    Alert.alert(
      'Supprimer l\'emplacement',
      `Voulez-vous vraiment supprimer "${selected.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => {
          setLocations(prev => prev.filter(l => l.id !== selected.id));
          setShowModal(false);
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
        <Text style={[styles.topTitle, { color: colors.black }]}>Emplacements</Text>
        {isAdmin && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#F97316' }]} onPress={openAdd}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={locations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.black }]}>{locations.length}</Text>
                <Text style={[styles.summaryLabel, { color: colors.gray400 }]}>Zones</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.black }]}>{totalItems}</Text>
                <Text style={[styles.summaryLabel, { color: colors.gray400 }]}>Articles placés</Text>
              </View>
            </View>
            <Text style={[styles.count, { color: colors.gray400 }]}>
              {locations.length} emplacement{locations.length > 1 ? 's' : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const zoneStyle = getZoneColor(item.zone);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface }]}
              activeOpacity={0.75}
              onPress={() => openEdit(item)}
            >
              <View style={[styles.emojiBox, { backgroundColor: colors.gray100 }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardName, { color: colors.black }]}>{item.name}</Text>
                <Text style={[styles.cardDesc, { color: colors.gray600 }]}>{item.description || '—'}</Text>
                <View style={[styles.zoneBadge, { backgroundColor: zoneStyle.bg }]}>
                  <Text style={[styles.zoneLabel, { color: zoneStyle.text }]}>{item.zone}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <Text style={[styles.itemCount, { color: colors.black }]}>{item.itemCount}</Text>
                <Text style={[styles.itemCountLabel, { color: colors.gray400 }]}>items</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.gray400} style={{ marginTop: 4 }} />
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
              <View style={styles.addIconBox}>
                <Ionicons name="add" size={20} color="#F97316" />
              </View>
              <Text style={styles.addLabel}>Ajouter un emplacement</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={[styles.handle, { backgroundColor: colors.gray200 }]} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetIconBox}>
                  <Ionicons name="location" size={22} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetTitle, { color: colors.black }]}>
                    {isEdit ? 'Modifier l\'emplacement' : 'Nouvel emplacement'}
                  </Text>
                  <Text style={[styles.sheetSub, { color: colors.gray400 }]}>
                    {isEdit ? selected?.name : 'Remplissez les informations ci-dessous'}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.gray100 }]} onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={18} color={colors.gray600} />
                </TouchableOpacity>
              </View>

              {/* Emoji picker */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.groupLabel, { color: colors.gray600 }]}>Icône</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
                  {EMOJIS.map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[
                        styles.emojiCell,
                        { backgroundColor: colors.gray100 },
                        emoji === e && { backgroundColor: colors.primaryBg, borderWidth: 2, borderColor: colors.primary },
                      ]}
                      onPress={() => setEmoji(e)}
                    >
                      <Text style={styles.emojiCellText}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.fields}>
                <Field label="Nom" value={name} onChange={setName} placeholder="Ex: Étagère A" icon="location-outline" required />
                <Field label="Description" value={description} onChange={setDescription} placeholder="Ex: Étagères A-01 à A-05" icon="document-text-outline" />
              </View>

              {/* Zone selector */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.groupLabel, { color: colors.gray600 }]}>
                  Type de zone <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={styles.zoneGrid}>
                  {ZONES.map(z => {
                    const zs = getZoneColor(z);
                    const active = zone === z;
                    return (
                      <TouchableOpacity
                        key={z}
                        style={[
                          styles.zoneChip,
                          { backgroundColor: colors.gray100, borderColor: colors.border },
                          active && { backgroundColor: zs.bg, borderColor: zs.text },
                        ]}
                        onPress={() => setZone(z)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.zoneChipText, { color: colors.gray600 }, active && { color: zs.text }]}>
                          {z}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {isEdit && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Supprimer cet emplacement</Text>
                </TouchableOpacity>
              )}

              <View style={styles.sheetActions}>
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.gray100 }]} onPress={() => setShowModal(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.gray600 }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#F97316' }]} onPress={handleSave}>
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
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  topTitle: { ...Typography.h4 },
  addBtn: { width: 38, height: 38, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },

  list: { paddingBottom: 100 },

  header: { padding: Spacing.md, gap: Spacing.md },
  summaryCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, ...Shadow.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { ...Typography.caption },
  summaryDivider: { width: 1, height: 36 },
  count: { ...Typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4 },

  card: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.md },
  separator: { height: 1, marginLeft: 70 },
  emojiBox: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  cardContent: { flex: 1, gap: 4 },
  cardName: { ...Typography.body, fontWeight: '600' },
  cardDesc: { ...Typography.bodySmall },
  zoneBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  zoneLabel: { ...Typography.caption, fontWeight: '600' },
  right: { alignItems: 'center', gap: 2 },
  itemCount: { fontSize: 20, fontWeight: '800' },
  itemCountLabel: { ...Typography.caption },

  addRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 13, gap: Spacing.md, borderTopWidth: 1 },
  addIconBox: { width: 46, height: 46, borderRadius: Radius.md, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  addLabel: { ...Typography.body, color: '#F97316', fontWeight: '600' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.md, paddingBottom: 40, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: Spacing.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  sheetIconBox: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { ...Typography.h4 },
  sheetSub: { ...Typography.caption, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },

  fieldGroup: { marginBottom: Spacing.md, gap: 8 },
  groupLabel: { ...Typography.bodySmall, fontWeight: '600' },
  emojiRow: { gap: Spacing.sm, paddingVertical: 4 },
  emojiCell: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  emojiCellText: { fontSize: 26 },

  fields: { gap: Spacing.md, marginBottom: Spacing.md },

  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  zoneChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5 },
  zoneChipText: { ...Typography.bodySmall, fontWeight: '600' },

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
