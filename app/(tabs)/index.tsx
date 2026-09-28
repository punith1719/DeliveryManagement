import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, Delivery } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  User,
  Search,
  X,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { driver } = useAuth();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 🔍 Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [searchSalesId, setSearchSalesId] = useState('');

  useEffect(() => {
    if (driver && driver.role === 'ADMIN') {
      router.replace('/(tabs)/admin-dashboard');
    }
  }, [driver]);

  const fetchDeliveries = async () => {
    if (!driver) return;

    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [driver]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  const filteredDeliveries =
    showFilter && searchSalesId
      ? deliveries.filter(d =>
          d.salesid?.toLowerCase().includes(searchSalesId.toLowerCase())
        )
      : deliveries;

  const updateStatus = async (deliveryId: string, newStatus: Delivery['status']) => {
    setUpdatingId(deliveryId);
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', deliveryId);

      if (error) throw error;

      setDeliveries(prev =>
        prev.map(d => (d.id === deliveryId ? { ...d, status: newStatus } : d))
      );
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'assigned': return '#8b5cf6';
      case 'in_transit': return '#3b82f6';
      case 'delivered': return '#10b981';
    }
  };

  const getStatusIcon = (status: Delivery['status']) => {
    switch (status) {
      case 'pending': return <Clock color="#f59e0b" size={20} />;
      case 'assigned': return <Package color="#8b5cf6" size={20} />;
      case 'in_transit': return <Truck color="#3b82f6" size={20} />;
      case 'delivered': return <CheckCircle2 color="#10b981" size={20} />;
    }
  };

  const getNextStatus = (currentStatus: Delivery['status']) => {
    if (currentStatus === 'assigned') return 'in_transit';
    if (currentStatus === 'in_transit') return 'delivered';
    return null;
  };

  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const nextStatus = getNextStatus(item.status);
    const isUpdating = updatingId === item.id;
  const isAdmin = driver?.role?.toUpperCase().trim() === 'ADMIN';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/delivery-details?id=${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.row}>
            <Package size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Sales ID</Text>
              <Text style={styles.infoValue}>{item.salesid || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <User size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{item.customer_name}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <MapPin size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{item.delivery_address}</Text>
            </View>
          </View>

          {nextStatus &&  !isAdmin &&(
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => updateStatus(item.id, nextStatus)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.updateButtonText}>Mark as {nextStatus}</Text>
                  <CheckCircle2 color="#fff" size={18} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome, {driver?.full_name}!</Text>
            <Text style={styles.subtitle}>
              {filteredDeliveries.length} deliveries
            </Text>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowFilter(!showFilter);
              setSearchSalesId('');
            }}
          >
            {showFilter ? <X size={22} /> : <Search size={22} />}
          </TouchableOpacity>
        </View>

        {showFilter && (
          <TextInput
            placeholder="Enter Sales ID"
            value={searchSalesId}
            onChangeText={setSearchSalesId}
            style={styles.searchInput}
          />
        )}
      </View>

      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  greeting: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },

  searchInput: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 14, fontWeight: '600' },

  cardContent: { padding: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#64748b' },
  infoValue: { fontSize: 15, color: '#1e293b' },

  updateButton: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  updateButtonText: { color: '#fff', fontWeight: '600' },
});
