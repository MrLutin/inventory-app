import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, Text, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import { InventoryProvider, useInventory } from '@/store/inventory';
import { AuthProvider, useAuth } from '@/store/auth';
import WebShell from '@/components/web/WebShell';

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router   = useRouter();
  const colors   = useColors();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === 'login';
    if (!user && !inAuth)  router.replace('/login');
    if (user  &&  inAuth)  router.replace('/(tabs)');
  }, [user, loading, segments]);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return <>{children}</>;
}

// ─── Inner layout (uses hooks that need providers) ────────────────────────────

function OfflineBanner() {
  const { isOffline, refresh } = useInventory();
  const { isOfflineAuth, logout } = useAuth();
  const offline = isOffline || isOfflineAuth;
  if (!offline) return null;

  const handleRetry = async () => {
    if (isOfflineAuth) {
      // Doit se reconnecter pour obtenir un vrai token Directus
      await logout();
    } else {
      await refresh();
    }
  };

  return (
    <View style={{
      backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 12,
    }}>
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'center' }}>
        {isOfflineAuth ? 'Connecté hors ligne — données locales' : 'Serveur Directus injoignable'}
      </Text>
      <TouchableOpacity onPress={handleRetry} style={{
        backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4,
        paddingHorizontal: 8, paddingVertical: 3,
      }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
          {isOfflineAuth ? 'Se reconnecter' : 'Réessayer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function AppLayout() {
  const colors = useColors();
  const scheme = useColorScheme();
  const { user } = useAuth();

  const stack = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="login"      options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
      <Stack.Screen name="item/[id]"  options={{ headerShown: false, animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
      <Stack.Screen name="item/form"  options={{ headerShown: false, animation: Platform.OS === 'web' ? 'none' : 'slide_from_bottom' }} />
      <Stack.Screen name="suppliers"  options={{ headerShown: false, animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
      <Stack.Screen name="locations"  options={{ headerShown: false, animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
      <Stack.Screen name="categories" options={{ headerShown: false, animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
    </Stack>
  );

  const content = (
    <>
      <OfflineBanner />
      {stack}
    </>
  );

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {Platform.OS === 'web' && user
        ? <WebShell>{content}</WebShell>
        : content
      }
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <AuthGuard>
          <AppLayout />
        </AuthGuard>
      </InventoryProvider>
    </AuthProvider>
  );
}
