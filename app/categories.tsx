import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Cette page est disponible uniquement sur la version web.
// Sur mobile, on redirige vers l'accueil.
export default function CategoriesScreen() {
  const router = useRouter();
  useEffect(() => { router.replace('/(tabs)'); }, []);
  return null;
}
