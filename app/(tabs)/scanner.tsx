import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Modal, ScrollView, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InventoryItem, getStockStatus } from '@/constants/data';
import { useInventory } from '@/store/inventory';
import { getImageUrl } from '@/lib/directusClient';
import { useColors, Spacing, Radius, Typography, Shadow } from '@/constants/theme';
import StockBadge from '@/components/StockBadge';
import CategoryBadge from '@/components/CategoryBadge';

type ScanState = 'scanning' | 'found' | 'not_found';

const SCAN_COOLDOWN = 2500;
const WINDOW_SIZE = 260;
const CORNER_SIZE = 22;
const CORNER_THICKNESS = 4;

export default function ScannerScreen() {
  const router = useRouter();
  const colors = useColors();
  const { items } = useInventory();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [lastBarcode, setLastBarcode] = useState('');
  const scanLock = useRef(false);
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(lineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [lineAnim]);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanLock.current || data === lastBarcode) return;
    scanLock.current = true;
    setLastBarcode(data);

    const item = items.find(i => i.barcode === data || i.sku === data);
    if (item) {
      setFoundItem(item);
      setScanState('found');
    } else {
      setFoundItem(null);
      setScanState('not_found');
    }

    setTimeout(() => { scanLock.current = false; }, SCAN_COOLDOWN);
  };

  const reset = () => {
    setScanState('scanning');
    setFoundItem(null);
    setLastBarcode('');
  };

  const lineTranslate = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permText, { color: colors.gray600 }]}>Chargement…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.permScreen, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.permEmoji}>📷</Text>
        <Text style={[styles.permTitle, { color: colors.black }]}>Accès caméra requis</Text>
        <Text style={[styles.permDesc, { color: colors.gray600 }]}>
          Pour scanner les codes-barres, l'application a besoin d'accéder à votre caméra.
        </Text>
        <TouchableOpacity style={[styles.permBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Autoriser l'accès</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanState === 'scanning' ? handleBarcode : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.overlayTop}>
          <SafeAreaView>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Text style={styles.backIcon}>‹</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.topTitle}>Scanner</Text>
                <Text style={styles.topSub}>Pointez la caméra sur un code-barres</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primaryLight }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primaryLight }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primaryLight }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primaryLight }]} />

            {scanState === 'scanning' && (
              <Animated.View style={[
                styles.scanLine,
                {
                  backgroundColor: colors.primaryLight,
                  shadowColor: colors.primaryLight,
                  transform: [{ translateY: lineTranslate }],
                },
              ]} />
            )}

            {scanState === 'found' && (
              <View style={[styles.resultOverlay, { backgroundColor: 'rgba(16,185,129,0.25)' }]}>
                <Text style={styles.resultIcon}>✓</Text>
              </View>
            )}
            {scanState === 'not_found' && (
              <View style={[styles.resultOverlay, { backgroundColor: 'rgba(239,68,68,0.25)' }]}>
                <Text style={styles.resultIcon}>✗</Text>
              </View>
            )}
          </View>
          <View style={styles.sideOverlay} />
        </View>

        <View style={styles.overlayBottom}>
          {scanState === 'scanning' && (
            <View style={styles.hint}>
              <Text style={styles.hintEmoji}>💡</Text>
              <Text style={styles.hintText}>
                Assurez-vous que le code-barres est bien éclairé et net
              </Text>
            </View>
          )}
          {scanState === 'not_found' && (
            <View style={styles.notFound}>
              <Text style={[styles.notFoundTitle, { color: colors.danger }]}>Code-barres inconnu</Text>
              <Text style={styles.notFoundSub}>{lastBarcode}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={reset}>
                <Text style={styles.retryText}>Scanner à nouveau</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Found item modal */}
      <Modal
        visible={scanState === 'found' && foundItem !== null}
        transparent
        animationType="slide"
        onRequestClose={reset}
      >
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            {foundItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.gray200 }]} />

                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetEmoji, { backgroundColor: colors.gray100 }]}>
                    {getImageUrl(foundItem.image)
                      ? <Image source={{ uri: getImageUrl(foundItem.image)! }} style={styles.sheetImage} resizeMode="cover" />
                      : <Ionicons name="image-outline" size={26} color={colors.gray400} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetName, { color: colors.black }]}>{foundItem.name}</Text>
                    <Text style={[styles.sheetSku, { color: colors.gray400 }]}>{foundItem.sku}</Text>
                  </View>
                  <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.gray100 }]} onPress={reset}>
                    <Text style={[styles.closeBtnText, { color: colors.gray600 }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.badgesRow}>
                  <StockBadge status={getStockStatus(foundItem)} />
                  <CategoryBadge category={foundItem.category} color={foundItem.categoryColor} />
                </View>

                <View style={[styles.quickStats, { backgroundColor: colors.gray50, borderColor: colors.border }]}>
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatValue, { color: colors.black }]}>{foundItem.quantity}</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.gray400 }]}>Quantité</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatValue, { color: colors.black }]}>{foundItem.price.toFixed(2)} $</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.gray400 }]}>Prix unitaire</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatValue, { color: colors.black }]}>{foundItem.locations.map(l => l.name).join(', ') || '—'}</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.gray400 }]}>Emplacement</Text>
                  </View>
                </View>

                <Text style={[styles.barcodeLine, { color: colors.gray400 }]}>📊 {foundItem.barcode}</Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => { reset(); router.push(`/item/${foundItem.id}`); }}
                  >
                    <Text style={styles.btnPrimaryText}>Voir la fiche complète</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: colors.gray100 }]} onPress={reset}>
                    <Text style={[styles.btnSecondaryText, { color: colors.gray600 }]}>Scanner un autre</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1 },
  overlayTop: { backgroundColor: 'rgba(0,0,0,0.6)' },
  middleRow: { flexDirection: 'row', height: WINDOW_SIZE },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 26, lineHeight: 30 },
  topTitle: { color: '#fff', ...Typography.h3, textAlign: 'center' },
  topSub: { color: 'rgba(255,255,255,0.6)', ...Typography.caption, textAlign: 'center' },

  scanWindow: { width: WINDOW_SIZE, height: WINDOW_SIZE, overflow: 'hidden' },

  // Corners (borderColor set inline)
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },

  // Scan line (bg + shadowColor set inline)
  scanLine: {
    position: 'absolute', left: 12, right: 12, height: 2, borderRadius: 1,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
  },

  resultOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  resultIcon: { fontSize: 64, color: '#fff', fontWeight: '700' },

  hint: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  hintEmoji: { fontSize: 16 },
  hintText: { color: 'rgba(255,255,255,0.75)', ...Typography.bodySmall, flex: 1 },

  notFound: { alignItems: 'center', gap: Spacing.sm },
  notFoundTitle: { ...Typography.h3 },
  notFoundSub: { color: 'rgba(255,255,255,0.5)', ...Typography.bodySmall },
  retryBtn: {
    marginTop: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  retryText: { color: '#fff', ...Typography.body, fontWeight: '600' },

  // Permission screen
  permScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  permEmoji: { fontSize: 56, marginBottom: Spacing.md },
  permTitle: { ...Typography.h2, marginBottom: Spacing.sm, textAlign: 'center' },
  permDesc: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.xl },
  permText: { ...Typography.body },
  permBtn: { borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: 14 },
  permBtnText: { color: '#fff', ...Typography.h4 },

  // Modal sheet
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.md, paddingBottom: 40, maxHeight: '75%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: Spacing.md,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  sheetEmoji: { width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sheetImage: { width: 56, height: 56 },
  sheetName: { ...Typography.h3 },
  sheetSku: { ...Typography.bodySmall, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 13 },

  badgesRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },

  quickStats: {
    flexDirection: 'row', borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1,
  },
  quickStat: { flex: 1, alignItems: 'center', gap: 4 },
  quickStatValue: { ...Typography.h4 },
  quickStatLabel: { ...Typography.caption },
  divider: { width: 1 },

  barcodeLine: { ...Typography.bodySmall, textAlign: 'center', marginBottom: Spacing.lg },

  actions: { gap: Spacing.sm },
  btnPrimary: { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', ...Typography.h4 },
  btnSecondary: { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  btnSecondaryText: { ...Typography.h4 },
});
