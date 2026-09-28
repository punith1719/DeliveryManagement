import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutNav() {
  const { driver, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

 useEffect(() => {
  if (loading) return;

  const currentRoute = segments.join('/');

  // 🚫 Not logged in → Login
  if (!driver) {
    if (currentRoute !== 'login') {
      router.replace('/login');
    }
    return;
  }

  // ✅ ADMIN FLOW
  if (driver.role === 'ADMIN') {
    // Only redirect if not already in tabs
    if (!segments.includes('(tabs)')) {
      router.replace('/(tabs)/admin-dashboard');
    }
    return;
  }

  // ✅ DRIVER FLOW
  if (driver.role === 'DRIVER') {
    if (!driver.trip_started) {
      if (currentRoute !== 'start-trip') {
        router.replace('/start-trip');
      }
    } else {
      // Only redirect if not already in tabs
      if (!segments.includes('(tabs)')) {
        router.replace('/(tabs)');
      }
    }
  }
}, [driver, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="start-trip" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
