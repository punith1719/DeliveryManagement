import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Fuel, FileText, Gauge, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function StartTrip() {
  const router = useRouter();
  const { driver, setDriver } = useAuth();

  const [odometer, setOdometer] = useState('');
  const [fuelRange, setFuelRange] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartTrip = async () => {
    if (!odometer || !fuelRange) return;

    setLoading(true);

    await supabase
      .from('drivers')
      .update({
        trip_started: true,
        start_odometer: Number(odometer),
        fuel_range: Number(fuelRange),
        start_notes: notes,
      })
      .eq('id', driver?.id);

    setDriver({ ...driver!, trip_started: true });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* LOGO / HEADER */}
      <View style={styles.header}>
        <Play size={52} color="#2563eb" />
        <Text style={styles.appName}>RoutePro</Text>
        <Text style={styles.tagline}>Start your delivery journey</Text>
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Start Trip</Text>

        {/* ODOMETER */}
        <View style={styles.inputGroup}>
          <Gauge size={18} color="#64748b" />
          <TextInput
            placeholder="Odometer reading"
            keyboardType="numeric"
            style={styles.input}
            value={odometer}
            onChangeText={setOdometer}
          />
        </View>

        {/* FUEL */}
        <View style={styles.inputGroup}>
          <Fuel size={18} color="#64748b" />
          <TextInput
            placeholder="Fuel range (km)"
            keyboardType="numeric"
            style={styles.input}
            value={fuelRange}
            onChangeText={setFuelRange}
          />
        </View>

        {/* NOTES */}
        <View style={styles.inputGroup}>
          <FileText size={18} color="#64748b" />
          <TextInput
            placeholder="Notes (optional)"
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartTrip}
          disabled={loading}
        >
          <Play size={18} color="#fff" />
          <Text style={styles.buttonText}>
            {loading ? 'Starting...' : 'Start Trip'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
