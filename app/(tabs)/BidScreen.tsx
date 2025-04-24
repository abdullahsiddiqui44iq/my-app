import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { initSocket, getSocket, submitBid, joinOrderRoom, leaveOrderRoom } from '../../services/socket';
import ApiService from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Order {
  id: number;
  serviceId: number;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: string;
  biddingEndTime: string;
}

interface Bid {
  id: number;
  amount: number;
  estimatedTime: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function BidScreen() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [socketInitialized, setSocketInitialized] = useState(false);
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) return;
        
        const user = JSON.parse(userData);
        await initSocket(user.id.toString());
        setSocketInitialized(true);
      } catch (error) {
        console.error('Socket setup error:', error);
      }
    };

    setupSocket();
    loadOrderDetails();
  }, []);

  useEffect(() => {
    if (!socketInitialized || !orderId) return;

    const socket = getSocket();
    joinOrderRoom(Number(orderId));

    socket.on('timer_updated', (data: { remainingTime: number, isExpired: boolean }) => {
      setTimeLeft(data.remainingTime);
      if (data.isExpired) {
        Alert.alert('Bidding Closed', 'The bidding time has expired');
      }
    });

    socket.on('order_status_changed', (data: { status: string }) => {
      if (data.status === 'cancelled') {
        Alert.alert('Order Cancelled', 'The customer has cancelled this order');
        router.back();
      }
    });

    return () => {
      leaveOrderRoom(Number(orderId));
      socket.off('timer_updated');
      socket.off('order_status_changed');
    };
  }, [socketInitialized, orderId]);

  const loadOrderDetails = async () => {
    try {
      const response = await ApiService.get(`/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setTimeLeft(Math.max(0, Math.floor((new Date(data.order.biddingEndTime).getTime() - new Date().getTime()) / 1000)));
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || !estimatedTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      submitBid(Number(orderId), {
        amount: Number(bidAmount),
        estimatedTime: Number(estimatedTime),
        message: message || undefined
      });

      Alert.alert('Success', 'Bid submitted successfully');
      router.back();
    } catch (error) {
      console.error('Error submitting bid:', error);
      Alert.alert('Error', 'Failed to submit bid');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E60FF" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Order Request</Text>
        <View style={styles.timer}>
          <Ionicons name="time-outline" size={20} color={timeLeft < 60 ? '#FF4E4E' : '#666B8F'} />
          <Text style={[styles.timerText, timeLeft < 60 && styles.timerWarning]}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.label}>Service Description</Text>
        <Text style={styles.value}>{order.description}</Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{order.location.address}</Text>
      </View>

      <View style={styles.bidForm}>
        <Text style={styles.label}>Your Bid (Rs.)</Text>
        <TextInput
          style={styles.input}
          value={bidAmount}
          onChangeText={setBidAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
        />

        <Text style={styles.label}>Estimated Time (minutes)</Text>
        <TextInput
          style={styles.input}
          value={estimatedTime}
          onChangeText={setEstimatedTime}
          keyboardType="numeric"
          placeholder="Enter estimated time"
        />

        <Text style={styles.label}>Message (optional)</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          placeholder="Add a message for the customer"
          multiline
        />

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmitBid}
        >
          <Text style={styles.submitButtonText}>Submit Bid</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    color: '#666B8F',
    marginLeft: 8,
  },
  timerWarning: {
    color: '#FF4E4E',
  },
  orderDetails: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  bidForm: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4E60FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 