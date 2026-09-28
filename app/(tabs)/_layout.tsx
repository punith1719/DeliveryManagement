import { Tabs } from 'expo-router';
import { Package, User, LayoutDashboard } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { driver } = useAuth();
  const isAdmin = driver?.role === 'ADMIN';

  console.log('Tab Layout - User:', driver?.username, 'Role:', driver?.role, 'IsAdmin:', isAdmin);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* INDEX TAB */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Deliveries',
          tabBarIcon: ({ size, color }) =>
            isAdmin ? <LayoutDashboard size={size} color={color} /> : <Package size={size} color={color} />,
        }}
      />

      {/* NOT DELIVERED - ONLY FOR DRIVERS */}
      {!isAdmin && (
        <Tabs.Screen
          name="not-delivered"
          options={{
            title: 'Not Delivered',
            tabBarIcon: ({ size, color }) => <Package size={size} color={color} />,
          }}
        />
      )}

      {/* DELIVERY DETAILS - HIDDEN TAB */}
      <Tabs.Screen
        name="delivery-details"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
