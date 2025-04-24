import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSocket, getSocket } from '../../services/socket';
import OrderNotification from '../../components/OrderNotification';
import BidSubmissionModal from '../../components/BidSubmissionModal';
import ApiService from '../../services/api';
import LocationService from '../../services/LocationService';

interface Order {
  id: number;
  serviceName: string;
  description: string;
  distance: number;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  Service: {
    name: string;
  };
}

export default function HomeScreen() {
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) return;

        const user = JSON.parse(userData);
        const socket = await initSocket(user.id.toString());

        socket.on('new_order_request', (order: Order) => {
          console.log('New order received:', order);
          setNewOrder(order);
        });

        socket.on('order_cancelled', (orderId: number) => {
          if (newOrder?.id === orderId) {
            setNewOrder(null);
            setShowBidModal(false);
            Alert.alert('Order Cancelled', 'The customer has cancelled this order.');
          }
        });

      } catch (error) {
        console.error('Socket setup error:', error);
      }
    };

    setupSocket();
  }, []);

  useEffect(() => {
    const setupLocation = async () => {
      try {
        await LocationService.startLocationUpdates();
      } catch (error) {
        console.error('Error setting up location:', error);
      }
    };

    setupLocation();

    return () => {
      LocationService.stopLocationUpdates();
    };
  }, []);

  const handleAcceptOrder = () => {
    setShowBidModal(true);
  };

  const handleDeclineOrder = () => {
    setNewOrder(null);
    // Optionally notify backend about decline
  };

  const handleSubmitBid = async (amount: number, estimatedTime: number, note: string) => {
    try {
      if (!newOrder) return;

      const response = await ApiService.post('/bids', {
        orderId: newOrder.id,
        amount,
        estimatedTime,
        message: note
      });

      if (!response.ok) {
        throw new Error('Failed to submit bid');
      }

      Alert.alert('Success', 'Your bid has been submitted successfully');
      setShowBidModal(false);
      setNewOrder(null);

    } catch (error) {
      console.error('Bid submission error:', error);
      Alert.alert('Error', 'Failed to submit bid. Please try again.');
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await ApiService.post('/vendors/toggle-availability', {
        isAvailable: !isAvailable
      });

      if (response.ok) {
        setIsAvailable(!isAvailable);
      }
    } catch (error) {
      console.error('Toggle availability error:', error);
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>John Doe</Text>
          </View>
          <TouchableOpacity 
            style={[styles.statusButton, !isAvailable && styles.statusButtonInactive]}
            onPress={toggleAvailability}
          >
            <View style={[styles.statusDot, !isAvailable && styles.statusDotInactive]} />
            <Text style={[styles.statusText, !isAvailable && styles.statusTextInactive]}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₨2,450</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Active Orders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderType}>
                <Ionicons name="construct-outline" size={20} color="#4E60FF" />
                <Text style={styles.orderTypeText}>Plumbing Service</Text>
              </View>
              <Text style={styles.orderAmount}>₨500</Text>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.customerName}>Customer: Sarah Smith</Text>
              <Text style={styles.orderAddress}>123 Main St, Block 6, Gulshan</Text>
            </View>
            <View style={styles.orderActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Start Service</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Service Completed</Text>
                <Text style={styles.activitySubtitle}>Plumbing repair at Block 2</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <Text style={styles.activityAmount}>₨350</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Order Notification Overlay */}
      {newOrder && !showBidModal && (
        <OrderNotification
          order={newOrder}
          onAccept={handleAcceptOrder}
          onDecline={handleDeclineOrder}
        />
      )}

      {/* Bid Submission Modal */}
      {newOrder && (
        <BidSubmissionModal
          visible={showBidModal}
          onClose={() => setShowBidModal(false)}
          onSubmit={handleSubmitBid}
          order={{
            serviceName: newOrder.Service.name,
            description: newOrder.description
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E4ED',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666B8F',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E2243',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E2243',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666B8F',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E2243',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTypeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#1E2243',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4E60FF',
  },
  orderDetails: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    color: '#1E2243',
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 14,
    color: '#666B8F',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4E60FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF4E4E',
  },
  cancelButtonText: {
    color: '#FF4E4E',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E2243',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#666B8F',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#A0A3BD',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4E60FF',
  },
  statusButtonInactive: {
    backgroundColor: '#FFE8E8',
  },
  statusDotInactive: {
    backgroundColor: '#FF6B6B',
  },
  statusTextInactive: {
    color: '#FF6B6B',
  },
}); 