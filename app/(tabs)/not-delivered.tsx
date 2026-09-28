import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function NotDeliveredScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); // delivery ID

  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submitNotDelivered = async () => {
    if (!id) {
      Alert.alert('Error', 'Delivery ID missing');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Required', 'Please enter a reason');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'not_delivered',
          not_delivered_comment: comment.trim(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No record updated');
      }

      // ✅ Success info message
      Alert.alert('Success', 'Marked as not delivered', [
        {
          text: 'OK',
          onPress: () =>
            router.replace({
              pathname: '/index',
              params: { id },
            }),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          router.push({
            pathname: '/delivery-details',
            params: { id },
          })
        }
      >
        <ArrowLeft size={22} color="#111827" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Reason for Not Delivered</Text>

      <TextInput
        style={styles.textInput}
        placeholder="Enter reason / comment..."
        multiline
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && { opacity: 0.6 }]}
        disabled={loading}
        onPress={submitNotDelivered}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Saving...' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { marginLeft: 6, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: { backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
