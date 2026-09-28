import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { X, RotateCw, Check } from 'lucide-react-native';

interface SignaturePadModalProps {
  visible: boolean;
  onClose: () => void;
  onSignatureCapture: (signature: string) => void;
  isLoading?: boolean;
}

export default function SignaturePadModal({
  visible,
  onClose,
  onSignatureCapture,
  isLoading = false,
}: SignaturePadModalProps) {
  const signatureRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // ✅ FIX — Clean base64 and send only pure base64 image
  const handleOK = (rawSignature: string) => {
    let signature = rawSignature;

    // Remove HTML if present
    if (signature.includes("<img")) {
      const match = signature.match(/src="(.*?)"/);
      if (match && match[1]) {
        signature = match[1]; // extract base64
      }
    }

    onSignatureCapture(signature);
    setIsEmpty(true);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setIsEmpty(true);
  };

  const handleClose = () => {
    setIsEmpty(true);
    onClose();
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Signature Pad</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={isLoading}>
            <X color={isLoading ? '#cbd5e1' : '#64748b'} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>Please sign below to complete delivery</Text>
        </View>

        <SignatureCanvas
          ref={signatureRef}
          onOK={handleOK}
          onBegin={handleBegin}
          onEnd={handleBegin}
          descriptionText=""
          clearText="Clear"
          confirmText="Confirm"
          imageType="image/png"
          webStyle={`
            .m-signature-pad--footer { display: none; }
            body,html { width: 100%; height: 100%; }
          `}
          style={styles.signaturePad}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClear}
            disabled={isEmpty || isLoading}>
            <RotateCw color="#fff" size={20} />
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.confirmButton,
              (isEmpty || isLoading) && styles.disabledButton
            ]}
            onPress={() => signatureRef.current?.readSignature()}
            disabled={isEmpty || isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Check color="#fff" size={20} />
                <Text style={styles.actionButtonText}>Confirm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', flex: 1 },
  closeButton: { padding: 8 },

  instructionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  instructionText: { fontSize: 14, color: '#1e40af', fontWeight: '500' },

  signaturePad: { flex: 1, borderRadius: 0 },

  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },

  clearButton: { backgroundColor: '#64748b' },
  confirmButton: { backgroundColor: '#2563eb' },
  disabledButton: { opacity: 0.5 },

  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
