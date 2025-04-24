import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BidSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, estimatedTime: number, note: string) => void;
  order: {
    serviceName: string;
    description: string;
  };
}

export default function BidSubmissionModal({ visible, onClose, onSubmit, order }: BidSubmissionModalProps) {
  const [amount, setAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!amount || !estimatedTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    onSubmit(Number(amount), Number(estimatedTime), note);
    setAmount('');
    setEstimatedTime('');
    setNote('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Place Your Bid</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666B8F" />
            </TouchableOpacity>
          </View>

          <Text style={styles.serviceName}>{order.serviceName}</Text>
          <Text style={styles.description}>{order.description}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bid Amount (PKR)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currency}>Rs.</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Enter your bid amount"
                placeholderTextColor="#A0A3BD"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Time (minutes)</Text>
            <TextInput
              style={styles.input}
              value={estimatedTime}
              onChangeText={setEstimatedTime}
              keyboardType="numeric"
              placeholder="Enter estimated time"
              placeholderTextColor="#A0A3BD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note to customer"
              placeholderTextColor="#A0A3BD"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit Bid</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E2243',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E60FF',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666B8F',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E2243',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E4ED',
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 16,
  },
  currency: {
    fontSize: 16,
    color: '#666B8F',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1E2243',
    marginLeft: 8,
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#4E60FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  submitText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
}); 