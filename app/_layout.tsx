import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, Platform } from 'react-native';
import { useColors } from '@/constants/theme';
import { InventoryProvider } from '@/store/inventory';
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
    </Stack>
  );

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* Sur web + connecté : sidebar persistante autour du Stack */}
      {Platform.OS === 'web' && user
        ? <WebShell>{stack}</WebShell>
        : stack
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
