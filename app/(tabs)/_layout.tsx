import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Radius, Shadow } from '@/constants/theme';

// Sur web, on masque la tab bar (remplacée par la sidebar WebShell)

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 6,
        },
        tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 16,
          left: 20,
          right: 20,
          borderRadius: Radius.xl,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 68,
          ...Shadow.lg,
        },
        tabBarItemStyle: { paddingTop: 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scanner"
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={{
              width: 56, height: 56, borderRadius: Radius.full,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
              marginTop: -20, borderWidth: 3,
              borderColor: colors.surface,
              ...Shadow.md,
            }}>
              <Ionicons name="scan" size={24} color="#fff" />
            </View>
          ),
          tabBarItemStyle: { justifyContent: 'center', alignItems: 'center' },
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          tabBarLabel: 'Compte',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
