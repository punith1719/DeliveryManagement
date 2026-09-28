import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, Delivery, Driver } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  User,
  Lock,
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

export default function AdminDashboardScreen() {
  const { driver: admin } = useAuth();
  const router = useRouter();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);

  const fetchData = async () => {
    try {
      const [deliveriesRes, driversRes] = await Promise.all([
        supabase
          .from('deliveries')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('drivers')
          .select('id, username, full_name, phone, role')
          .eq('role', 'DRIVER')
          .order('full_name'),
      ]);

      if (deliveriesRes.error) throw deliveriesRes.error;
      if (driversRes.error) throw driversRes.error;

      setDeliveries(deliveriesRes.data || []);
      setFilteredDeliveries(deliveriesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (admin?.role === 'ADMIN') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [admin]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const assignDriver = async (deliveryId: string, driverId: string) => {
    setAssigningId(deliveryId);
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          driver_id: driverId,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) throw error;

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? { ...d, driver_id: driverId, status: 'assigned' }
            : d
        )
      );
      // update filteredDeliveries as well
      setFilteredDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? { ...d, driver_id: driverId, status: 'assigned' }
            : d
        )
      );
    } catch (error) {
      console.error('Error assigning driver:', error);
    } finally {
      setAssigningId(null);
    }
  };

  // 🔒 NON-ADMIN VIEW
  if (!loading && admin && admin.role !== 'ADMIN') {
    return (
      <View style={styles.lockContainer}>
        <Lock size={64} color="#94a3b8" />
        <Text style={styles.lockTitle}>Admin Access Required</Text>
        <Text style={styles.lockMessage}>
          You don’t have permission to access this dashboard.
        </Text>
      </View>
    );
  }

  // ⏳ LOADING
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // 🔍 FILTER FUNCTION
  const handleSearch = () => {
    if (!searchText.trim()) {
      setFilteredDeliveries(deliveries);
      return;
    }
    const filtered = deliveries.filter((d) =>
      d.salesid?.toLowerCase().includes(searchText.trim().toLowerCase())
    );
    setFilteredDeliveries(filtered);
  };

  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const isAssigning = assigningId === item.id;

    return (
      <View style={styles.card}>
        {/* Status */}
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            {item.status === 'pending' && <Clock color="#f59e0b" size={20} />}
            {item.status === 'assigned' && <User color="#8b5cf6" size={20} />}
            {item.status === 'in_transit' && <Truck color="#3b82f6" size={20} />}
            {item.status === 'delivered' && <CheckCircle2 color="#10b981" size={20} />}
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Card content */}
        <View style={styles.cardContent}>
          {/* Sales ID */}
          <View style={styles.row}>
            <Package size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Sales ID</Text>
              <Text style={styles.infoValue}>{item.salesid || 'N/A'}</Text>
            </View>
          </View>

          {/* Customer */}
          <View style={styles.row}>
            <User size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{item.customer_name}</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.row}>
            <MapPin size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{item.delivery_address}</Text>
            </View>
          </View>

          {/* Product */}
          <View style={styles.row}>
            <Package size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Product</Text>
              <Text style={styles.infoValue}>
                {item.product_name || item.product_details || 'No product added'}
              </Text>
            </View>
          </View>

          {/* Driver Picker */}
          <View style={styles.row}>
            <User size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Assigned Driver</Text>
              {isAssigning ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Picker
                  selectedValue={item.driver_id || ''}
                  enabled={item.status !== 'in_transit' && item.status !== 'delivered'}
                  onValueChange={(value) => {
                    if (value && value !== item.driver_id) {
                      assignDriver(item.id, value);
                    }
                  }}
                  style={[
                    styles.picker,
                    (item.status === 'in_transit' || item.status === 'delivered') && { opacity: 0.5 },
                  ]}
                >
                  <Picker.Item label="Select Driver" value="" />
                  {drivers.map((driver) => (
                    <Picker.Item key={driver.id} label={driver.full_name} value={driver.id} />
                  ))}
                </Picker>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>
          {deliveries.length} deliveries • {drivers.length} drivers
        </Text>

        {/* 🔍 SEARCH */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Sales ID"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontWeight: '600', textTransform: 'capitalize', marginLeft: 4 },
  cardContent: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  infoContent: {
    flex: 1,
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 20,
  },
  picker: {
    height: 40,
    width: '100%',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  lockTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  lockMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

