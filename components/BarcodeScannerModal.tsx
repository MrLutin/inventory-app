import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Animated, SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onScanned: (barcode: string) => void;
  onClose: () => void;
}

const WINDOW = 260;
const CORNER = 22;
const THICKNESS = 4;

export default function BarcodeScannerModal({ visible, onScanned, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const colors = useColors();
  const scanLock = useRef(false);
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scanLock.current = false;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(lineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, lineAnim]);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    onScanned(data);
  };

  const lineY = lineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, WINDOW - 4] });

  if (!visible) return null;

  // Demande de permission
  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={[styles.permScreen, { backgroundColor: colors.background }]}>
          <Text style={styles.permEmoji}>📷</Text>
          <Text style={[styles.permTitle, { color: colors.black }]}>Accès caméra requis</Text>
          <Text style={[styles.permDesc, { color: colors.gray600 }]}>
            Pour scanner un code-barres, l'application a besoin d'accéder à votre caméra.
          </Text>
          <TouchableOpacity style={[styles.permBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Autoriser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permCancel} onPress={onClose}>
            <Text style={[styles.permCancelText, { color: colors.gray400 }]}>Annuler</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={handleBarcode}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'],
          }}
        />

        {/* Overlay */}
        <SafeAreaView style={styles.overlay}>

          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.topTitle}>Scanner le code-barres</Text>
              <Text style={styles.topSub}>Centrez le code dans le cadre</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Cadre central */}
          <View style={styles.middle}>
            <View style={styles.sideDark} />
            <View style={styles.window}>
              {/* Coins */}
              <View style={[styles.corner, styles.TL, { borderColor: colors.primaryLight }]} />
              <View style={[styles.corner, styles.TR, { borderColor: colors.primaryLight }]} />
              <View style={[styles.corner, styles.BL, { borderColor: colors.primaryLight }]} />
              <View style={[styles.corner, styles.BR, { borderColor: colors.primaryLight }]} />
              {/* Ligne laser */}
              <Animated.View style={[styles.laser, {
                backgroundColor: colors.primaryLight,
                shadowColor: colors.primaryLight,
                transform: [{ translateY: lineY }],
              }]} />
            </View>
            <View style={styles.sideDark} />
          </View>

          {/* Bas */}
          <View style={styles.bottom}>
            <View style={styles.hint}>
              <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.hintText}>
                Compatible EAN-13, QR Code, Code 128 et plus
              </Text>
            </View>
          </View>

        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1 },

  // Top bar
  topBar: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  topSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 2 },

  // Middle row
  middle: { flexDirection: 'row', height: WINDOW },
  sideDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  window: { width: WINDOW, height: WINDOW, overflow: 'hidden' },

  // Corners (borderColor set inline)
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  TL: { top: 0, left: 0, borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS, borderTopLeftRadius: 4 },
  TR: { top: 0, right: 0, borderTopWidth: THICKNESS, borderRightWidth: THICKNESS, borderTopRightRadius: 4 },
  BL: { bottom: 0, left: 0, borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS, borderBottomLeftRadius: 4 },
  BR: { bottom: 0, right: 0, borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS, borderBottomRightRadius: 4 },

  // Laser (bg + shadowColor set inline)
  laser: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },

  // Bottom
  bottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  hintText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '400', flex: 1 },

  // Permission (bg, text colors set inline)
  permScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  permEmoji: { fontSize: 52 },
  permTitle: { ...Typography.h2, textAlign: 'center' },
  permDesc: { ...Typography.body, textAlign: 'center' },
  permBtn: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 13,
    marginTop: Spacing.sm,
  },
  permBtnText: { color: '#fff', ...Typography.h4 },
  permCancel: { paddingVertical: 10 },
  permCancelText: { ...Typography.body },
});
