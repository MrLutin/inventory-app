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

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  itemCount: number;
}

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Apple France',   contact: 'apple.com',       email: 'pro@apple.fr',         phone: '+33 1 00 00 00 01', itemCount: 2 },
  { id: '2', name: 'Bosch Pro',      contact: 'bosch-pro.fr',    email: 'contact@bosch-pro.fr', phone: '+33 1 00 00 00 02', itemCount: 1 },
  { id: '3', name: 'EcoWear',        contact: 'ecowear.fr',      email: 'info@ecowear.fr',       phone: '+33 1 00 00 00 03', itemCount: 1 },
  { id: '4', name: 'ErgoFlex Pro',   contact: 'ergoflex.fr',     email: 'pro@ergoflex.fr',       phone: '+33 1 00 00 00 04', itemCount: 1 },
  { id: '5', name: 'FlexiDesk',      contact: 'flexidesk.com',   email: 'sales@flexidesk.com',   phone: '+33 1 00 00 00 05', itemCount: 1 },
  { id: '6', name: 'Keychron',       contact: 'keychron.com',    email: 'support@keychron.com',  phone: '+33 1 00 00 00 06', itemCount: 1 },
  { id: '7', name: 'LG Electronics', contact: 'lg.com/fr',       email: 'pro@lg.fr',             phone: '+33 1 00 00 00 07', itemCount: 1 },
  { id: '8', name: 'Terres de Café', contact: 'terresdecafe.fr', email: 'pro@terresdecafe.fr',   phone: '+33 1 00 00 00 08', itemCount: 1 },
];

const PALETTE = [
  '#6366F1', '#10B981', '#F59E0B',
  '#EC4899', '#F97316', '#8B5CF6', '#06B6D4', '#14B8A6',
];

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

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
          style={[fStyles.input, { color: colors.black, outlineStyle: 'none' as any }]}
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

export default function WebSuppliersScreen() {
  const { add } = useLocalSearchParams<{ add?: string }>();
  const colors   = useColors();
  const { isAdmin } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [showModal, setShowModal] = useState(false);
  const [selected,  setSelected]  = useState<Supplier | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [name,    setName]    = useState('');
  const [contact, setContact] = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');

  const isEdit = selected !== null;

  // Auto-open form when navigating from sidebar with ?add=1
  useEffect(() => {
    if (add === '1') openAdd();
  }, []);

  const openAdd = () => {
    setSelected(null);
    setName(''); setContact(''); setEmail(''); setPhone('');
    setShowModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    setSelected(supplier);
    setName(supplier.name);
    setContact(supplier.contact);
    setEmail(supplier.email);
    setPhone(supplier.phone);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (isEdit) {
      setSuppliers(prev => prev.map(s =>
        s.id === selected.id
          ? { ...s, name: name.trim(), contact: contact.trim(), email: email.trim(), phone: phone.trim() }
          : s
      ));
    } else {
      setSuppliers(prev => [
        { id: Date.now().toString(), name: name.trim(), contact: contact.trim(), email: email.trim(), phone: phone.trim(), itemCount: 0 },
        ...prev,
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (supplier: Supplier) => {
    if (globalThis.confirm?.(`Supprimer le fournisseur "${supplier.name}" ?`)) {
      setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
      setShowModal(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Page header ── */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.black }]}>Fournisseurs</Text>
          <Text style={[styles.pageSubtitle, { color: colors.gray400 }]}>
            {suppliers.length} fournisseur{suppliers.length > 1 ? 's' : ''} référencé{suppliers.length > 1 ? 's' : ''}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAdd}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Nouveau fournisseur</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Table ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.tableWrap}>

          {/* Table header */}
          <View style={[styles.tableHead, { backgroundColor: colors.gray50, borderBottomColor: colors.border }]}>
            <View style={styles.colAvatar} />
            <Text style={[styles.thCell, styles.colName,    { color: colors.gray400 }]}>Fournisseur</Text>
            <Text style={[styles.thCell, styles.colContact, { color: colors.gray400 }]}>Site web</Text>
            <Text style={[styles.thCell, styles.colEmail,   { color: colors.gray400 }]}>Email</Text>
            <Text style={[styles.thCell, styles.colPhone,   { color: colors.gray400 }]}>Téléphone</Text>
            <Text style={[styles.thCell, styles.colCount,   { color: colors.gray400 }]}>Articles</Text>
            {isAdmin && <View style={styles.colActions} />}
          </View>

          {/* Rows */}
          {suppliers.map((item, index) => {
            const color   = PALETTE[index % PALETTE.length];
            const hovered = hoveredId === item.id;
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.border },
                  hovered && { backgroundColor: `${colors.primary}08` },
                ]}
                onHoverIn={() => setHoveredId(item.id)}
                onHoverOut={() => setHoveredId(null)}
                onPress={() => isAdmin && openEdit(item)}
              >
                {/* Avatar */}
                <View style={styles.colAvatar}>
                  <View style={[styles.avatar, { backgroundColor: `${color}18` }]}>
                    <Text style={[styles.avatarText, { color }]}>{initials(item.name)}</Text>
                  </View>
                </View>

                {/* Name */}
                <View style={styles.colName}>
                  <Text style={[styles.cellPrimary, { color: colors.black }]}>{item.name}</Text>
                </View>

                {/* Contact */}
                <View style={styles.colContact}>
                  <Text style={[styles.cellSecondary, { color: colors.gray600 }]}>
                    {item.contact || '—'}
                  </Text>
                </View>

                {/* Email */}
                <View style={styles.colEmail}>
                  <Text style={[styles.cellSecondary, { color: colors.gray600 }]}>
                    {item.email || '—'}
                  </Text>
                </View>

                {/* Phone */}
                <View style={styles.colPhone}>
                  <Text style={[styles.cellSecondary, { color: colors.gray600 }]}>
                    {item.phone || '—'}
                  </Text>
                </View>

                {/* Articles count */}
                <View style={[styles.colCount, { alignItems: 'center' }]}>
                  <View style={[styles.countBadge, { backgroundColor: `${color}18` }]}>
                    <Text style={[styles.countBadgeText, { color }]}>{item.itemCount}</Text>
                  </View>
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
                      onPress={e => { (e as any).stopPropagation?.(); openEdit(item); }}
                    >
                      <Ionicons name="pencil-outline" size={15} color={colors.primary} />
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
          {suppliers.length === 0 && (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={40} color={colors.gray400} />
              <Text style={[styles.emptyTitle, { color: colors.black }]}>Aucun fournisseur</Text>
              <Text style={[styles.emptyText, { color: colors.gray400 }]}>
                Ajoutez votre premier fournisseur.
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
            {/* Dialog header */}
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="business" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dialogTitle, { color: colors.black }]}>
                  {isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
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
              <Field label="Nom"       value={name}    onChange={setName}    placeholder="Ex: Apple France"        icon="business-outline" required keyboardType="default" />
              <Field label="Site web"  value={contact} onChange={setContact} placeholder="Ex: apple.com"           icon="globe-outline"    keyboardType="url" />
              <Field label="Email"     value={email}   onChange={setEmail}   placeholder="Ex: pro@apple.fr"        icon="mail-outline"     keyboardType="email-address" />
              <Field label="Téléphone" value={phone}   onChange={setPhone}   placeholder="Ex: +33 1 00 00 00 00"   icon="call-outline"     keyboardType="phone-pad" />
            </View>

            {/* Delete (edit mode) */}
            {isEdit && (
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: colors.dangerLight, borderColor: '#FECACA' }]}
                onPress={() => selected && handleDelete(selected)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Supprimer ce fournisseur</Text>
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

  // Table
  tableWrap: { padding: Spacing.xl },
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, borderBottomWidth: 0,
    marginBottom: 4,
  },
  thCell: { ...Typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderRadius: Radius.sm,
  },

  // Columns
  colAvatar:  { width: 52, alignItems: 'center' },
  colName:    { flex: 1.5, paddingRight: Spacing.md },
  colContact: { flex: 1.2, paddingRight: Spacing.md },
  colEmail:   { flex: 2,   paddingRight: Spacing.md },
  colPhone:   { flex: 1.5, paddingRight: Spacing.md },
  colCount:   { width: 80 },
  colActions: { width: 80 },

  avatar:     { width: 36, height: 36, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '800' },

  cellPrimary:   { ...Typography.body, fontWeight: '600' },
  cellSecondary: { ...Typography.bodySmall },

  countBadge:     { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  countBadgeText: { ...Typography.caption, fontWeight: '700' },

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
    maxWidth: 480,
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
