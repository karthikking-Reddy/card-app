import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { requestCardApproval } from '../services/cardApprovalService';

export default function ApprovalRequiredModal({ visible, card, onClose, onEdit, onUpdated }) {
  const [submitting, setSubmitting] = useState(false);
  const status = card?.approval_status || 'draft';
  const copy = status === 'pending'
    ? { icon: 'time-outline', title: 'Approval Pending', message: 'Your card has been submitted and is waiting for administrator approval.' }
    : status === 'rejected'
      ? { icon: 'alert-circle-outline', title: 'Card Needs Changes', message: card?.rejection_reason || 'Please update your card and submit it again.' }
      : { icon: 'shield-checkmark-outline', title: 'Card Approval Required', message: 'Your card must be approved before you can share it publicly.' };

  function confirmRequest() {
    Alert.alert('Request Card Approval', 'Submit this card for administrator approval?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: submitRequest },
    ]);
  }

  async function submitRequest() {
    if (!card?.id || submitting) return;
    setSubmitting(true);
    try {
      await requestCardApproval(card.id);
      await onUpdated?.();
      onClose?.();
      Alert.alert('Submitted', 'Card submitted for approval.');
    } catch {
      Alert.alert('Unable to submit', 'Please check the card details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.icon}><Ionicons name={copy.icon} size={30} color="#F6B91A" /></View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.message}>{copy.message}</Text>
          {status === 'rejected' && card?.rejection_reason ? (
            <View style={styles.reason}><Text style={styles.reasonLabel}>Rejection reason:</Text><Text style={styles.reasonText}>{card.rejection_reason}</Text></View>
          ) : null}

          {status === 'pending' ? (
            <TouchableOpacity style={styles.primary} onPress={onClose}><Text style={styles.primaryText}>OK</Text></TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.primary} onPress={confirmRequest} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#06162D" /> : <Text style={styles.primaryText}>{status === 'rejected' ? 'Request Approval Again' : 'Request Approval'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondary} onPress={onEdit} disabled={submitting}>
                <Text style={styles.secondaryText}>{status === 'rejected' ? 'Edit Card' : 'Continue Editing'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(6,22,45,.72)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F6B91A', padding: 22, alignItems: 'center' },
  icon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#FFF4D6', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#06162D', fontSize: 21, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  message: { color: '#667085', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  reason: { width: '100%', backgroundColor: '#FEF2F2', borderRadius: 13, padding: 12, marginTop: 14 },
  reasonLabel: { color: '#991B1B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  reasonText: { color: '#7F1D1D', fontSize: 12, lineHeight: 18, marginTop: 4 },
  primary: { width: '100%', minHeight: 48, backgroundColor: '#F6B91A', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryText: { color: '#06162D', fontWeight: '900' },
  secondary: { width: '100%', minHeight: 46, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  secondaryText: { color: '#06162D', fontWeight: '800' },
});
