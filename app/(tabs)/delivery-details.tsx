import React, { useState, useEffect } from 'react';
import { Buffer } from "buffer";
import { decode as atob } from "base-64";


import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { supabase, Delivery } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import PhotoCaptureModal from '@/components/PhotoCaptureModal';
import SignaturePadModal from '@/components/SignaturePadModal';

import {
  MapPin,
  Package,
  CheckCircle2,
  Truck,
  Clock,
  ArrowLeft,
  Navigation,
  Camera,
  PenTool,
  Check,
} from 'lucide-react-native';

export default function DeliveryDetailsScreen() {
  const router = useRouter();
  const { driver } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);



  // 🚀 REQUIRED: Attach to modals
  const handlePhotoCapture = (base64Image: string) => {
    setPhotoUri(base64Image);
    setShowPhotoModal(false);
  };

  const handleSignatureCapture = (base64Signature: string) => {
    setSignatureUri(base64Signature);
    setShowSignatureModal(false);
  };

  useEffect(() => {
    fetchDeliveryDetails();
  }, [id]);

  const fetchDeliveryDetails = async () => {
    if (!id) return;

    try {
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      setDelivery(data);
    } catch (error) {
      console.error('Error fetching delivery details:', error);
      Alert.alert('Error', 'Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // 🚀 SUPABASE STORAGE UPLOAD
  // ---------------------------------------------------
const uploadFile = async (base64: string, filePath: string) => {
  try {
    // ---- FIXED CLEAN BASE64 ----
    let cleanBase64 = base64;
    if (cleanBase64.startsWith("data")) {
      cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
    }
    cleanBase64 = cleanBase64.trim();

    const buffer = Buffer.from(cleanBase64, "base64");

    const { data, error } = await supabase.storage
      .from("delivery-proof")
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("delivery-proof")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
};
const updateD365Status = async (salesid: string) => {
  const supabaseUrl = "https://jzghbspmllbaqrdepgeg.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Z2hic3BtbGxiYXFyZGVwZ2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTEyMTYsImV4cCI6MjA4MDQ4NzIxNn0.Yx3XJ6twGoKKGOtBBHvXWFpf8IZRGH7KyaUPuKMzQ64";

  const apiUrl = `${supabaseUrl}/functions/v1/update-delivery-status`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ salesid }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`D365 update failed: ${err}`);
  }

  return await response.json();
};

  // ---------------------------------------------------
  // 🚀 COMPLETE DELIVERY
  // ---------------------------------------------------
 const completeDelivery = async () => {
  if (!photoUri || !signatureUri) {
    Alert.alert("Required", "Please capture both photo and signature");
    return;
  }

  try {
    const timestamp = Date.now();

    // 1️⃣ Upload proof files
    const [photoUrl, signatureUrl] = await Promise.all([
      uploadFile(photoUri, `photos/${id}-${timestamp}.png`),
      uploadFile(signatureUri, `signatures/${id}-${timestamp}.png`),
    ]);

    // 2️⃣ Update Supabase delivery
    const { data, error } = await supabase
      .from("deliveries")
      .update({
        photo_url: photoUrl,
        signature_url: signatureUrl,
        status: "delivered",
      })
      .eq("id", id)
      .select("salesid,dataareaid")
      .single();

    if (error) throw error;

    // 3️⃣ Update D365 via Edge function using user token
    await updateD365Status(data.salesid);

    // 4️⃣ Update local state to show delivered status immediately
    setDelivery(prev => prev ? { ...prev, status: 'delivered' } : null);

    // 5️⃣ Success
    Alert.alert("Success", "Delivery completed successfully", [
      { text: "OK", onPress: () => router.replace('/(tabs)/index') },
    ]);
  } catch (err: any) {
    console.error("Delivery completion error:", err);
    Alert.alert("Error", err.message || "Delivery failed or D365 sync failed");
  }
};

 


  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------

  const getStatusIcon = (status: Delivery['status']) => {
    switch (status) {
      case 'pending': return <Clock color="#f59e0b" size={24} />;
      case 'assigned': return <Package color="#8b5cf6" size={24} />;
      case 'in_transit': return <Truck color="#3b82f6" size={24} />;
      case 'delivered': return <CheckCircle2 color="#10b981" size={24} />;
    }
  };

  const getStatusLabel = (status: Delivery['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'assigned': return 'Assigned';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
    }
  };

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'assigned': return '#8b5cf6';
      case 'in_transit': return '#3b82f6';
      case 'delivered': return '#10b981';
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Delivery not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/index')}>
          <ArrowLeft color="#2563eb" size={20} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDelivered = delivery.status === 'delivered';
  const canComplete = delivery.status === 'in_transit';

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => router.replace('/(tabs)/index')}>
          <ArrowLeft color="#2563eb" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>

        {/* Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>{getStatusIcon(delivery.status)}</View>
          <Text style={[styles.statusLabel, { color: getStatusColor(delivery.status) }]}>
            {getStatusLabel(delivery.status)}
          </Text>
        </View>

        <View style={styles.infoRow}>
  <Package size={20} color="#64748b" />
  <View style={styles.infoContent}>
    <Text style={styles.infoLabel}>Sales ID</Text>
    <Text style={styles.infoValue}>
      {delivery?.salesid || 'N/A'}
    </Text>
  </View>
</View>


        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Package size={20} color="#64748b" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Customer Name</Text>
                <Text style={styles.infoValue}>{delivery.customer_name}</Text>
              </View>
            </View>

            
     <View style={styles.infoRow}>
  <Package size={20} color="#64748b" />
  <View style={styles.infoContent}>
    <Text style={styles.infoLabel}>Product</Text>
    <Text style={styles.infoValue}>
      {delivery.product_name || "No product added"}
    </Text>
  </View>
</View>


            <View style={styles.infoRow}>
              <MapPin size={20} color="#64748b" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{delivery.delivery_address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Navigate */}
        {!isDelivered && (
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() =>
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.delivery_address)}`)
            }
          >
            <Navigation size={20} color="#fff" />
            <Text style={styles.navigateButtonText}>navigation to customer name</Text>
          </TouchableOpacity>
        )}

        {/* Delivery Proof Section */}
        {canComplete && (
          <View style={styles.proofSection}>
            <Text style={styles.sectionTitle}>Delivery Proof</Text>

            {/* Photo */}
            <TouchableOpacity
              style={[styles.proofCard, photoUri && styles.proofCardCompleted]}
              onPress={() => setShowPhotoModal(true)}
            >
              <View style={styles.proofCardContent}>
                <Camera size={24} color={photoUri ? '#10b981' : '#2563eb'} />
                <View style={styles.proofCardText}>
                  <Text style={styles.proofCardTitle}>
                    {photoUri ? 'Photo Captured' : 'Capture Photo'}
                  </Text>
                  <Text style={styles.proofCardSubtitle}>
                    {photoUri ? 'Tap to retake' : 'Take delivery photo'}
                  </Text>
                </View>
              </View>
              {photoUri && <Check color="#10b981" size={24} />}
            </TouchableOpacity>

            {/* Signature */}
            <TouchableOpacity
              style={[styles.proofCard, signatureUri && styles.proofCardCompleted]}
              onPress={() => setShowSignatureModal(true)}
            >
              <View style={styles.proofCardContent}>
                <PenTool size={24} color={signatureUri ? '#10b981' : '#2563eb'} />
                <View style={styles.proofCardText}>
                  <Text style={styles.proofCardTitle}>
                    {signatureUri ? 'Signature Added' : 'Add Signature'}
                  </Text>
                  <Text style={styles.proofCardSubtitle}>
                    {signatureUri ? 'Tap to redo' : 'Get customer signature'}
                  </Text>
                </View>
              </View>
              {signatureUri && <Check color="#10b981" size={24} />}
            </TouchableOpacity>

             {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              {/* Complete Delivery */}
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  (!photoUri || !signatureUri) && styles.completeButtonDisabled,
                  { flex: 1 },
                ]}
                disabled={!photoUri || !signatureUri}
                onPress={completeDelivery}
              >
                <CheckCircle2 size={20} color="#fff" />
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
        
              <TouchableOpacity
                style={[styles.notDeliveredButton, { flex: 1 }]}
                onPress={() => router.replace(`/not-delivered?id=${delivery.id}`)}
              >
                <Text style={styles.notDeliveredText}>Not Delivered</Text>
              </TouchableOpacity>

            </View>
          </View> // <-- THIS CLOSING TAG FOR proofSection
        )}
      </ScrollView>

      {/* Modals */}
      <PhotoCaptureModal
        visible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoCapture={handlePhotoCapture}
      />

      <SignaturePadModal
        visible={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSignatureCapture={handleSignatureCapture}
      />

    </View>
  );
}

/* ---- STYLES ---- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backIconButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', flex: 1 },

  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },

  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },

  statusIconContainer: { marginBottom: 10 },
  statusLabel: { fontSize: 18, fontWeight: '700' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, color: '#1e293b' },

  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  infoRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 15 },

  navigateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  navigateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  proofSection: { marginTop: 10 },

  proofCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  proofCardCompleted: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },

  proofCardContent: { flexDirection: 'row', gap: 12, flex: 1 },
  proofCardText: { flex: 1 },
  proofCardTitle: { fontSize: 15, fontWeight: '600' },
  proofCardSubtitle: { fontSize: 13, color: '#64748b' },

  completeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },

  

  completeButtonDisabled: { opacity: 0.4 },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  errorText: { fontSize: 16, color: '#64748b' },
  backButton: { flexDirection: 'row', marginTop: 16, gap: 8 },
  backButtonText: { fontSize: 14, color: '#2563eb' },

  notDeliveredButton: {
  backgroundColor: '#ef4444',
  paddingVertical: 14,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
},

notDeliveredText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},

});
