import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, RotateCw, Check } from 'lucide-react-native';

interface PhotoCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoCapture: (base64: string) => void;
  isLoading?: boolean;
}

export default function PhotoCaptureModal({
  visible,
  onClose,
  onPhotoCapture,
  isLoading = false,
}: PhotoCaptureModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  // ✅ FIXED — no premature upload
  const takePhoto = async () => {
    if (!cameraRef.current) return;

    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.4,
      });

      if (photo?.base64) {
        const formatted = `data:image/png;base64,${photo.base64}`;
        setCapturedPhoto(formatted); // show preview only
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // ✅ This is the only place where we send photo to parent
  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      setCapturedPhoto(null);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleClose = () => {
    setCapturedPhoto(null);
    onClose();
  };

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading camera...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              This app needs access to your camera to capture delivery photos.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (capturedPhoto) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Review Photo</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} disabled={isLoading}>
              <X color={isLoading ? '#cbd5e1' : '#64748b'} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retakeButton]}
              onPress={handleRetake}
              disabled={isLoading}
            >
              <RotateCw color="#fff" size={20} />
              <Text style={styles.actionButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton, isLoading && styles.disabledButton]}
              onPress={handleConfirmPhoto}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Check color="#fff" size={20} />
                  <Text style={styles.actionButtonText}>Use Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Capture Delivery Photo</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} disabled={isTakingPhoto}>
            <X color={isTakingPhoto ? '#cbd5e1' : '#fff'} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={[styles.captureButton, isTakingPhoto && styles.disabledButton]}
            onPress={takePhoto}
            disabled={isTakingPhoto}
          >
            {isTakingPhoto ? (
              <ActivityIndicator color="#2563eb" size="large" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1 },
  closeButton: { padding: 8 },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2563eb',
  },
  captureButtonInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563eb' },
  disabledButton: { opacity: 0.5 },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#f8fafc' },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  permissionText: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center', lineHeight: 24 },
  permissionButton: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginBottom: 16 },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 20, backgroundColor: 'rgba(0, 0, 0, 0.7)', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  retakeButton: { backgroundColor: '#64748b' },
  confirmButton: { backgroundColor: '#2563eb' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
