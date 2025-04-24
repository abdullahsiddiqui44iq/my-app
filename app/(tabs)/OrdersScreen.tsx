import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { initSocket, getSocket } from '../../services/socket';
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
  biddingStatus: string;
  biddingEndTime: string;
  createdAt: string;
  Service: {
    name: string;
    category: string;
  };
  Bid?: {
    id: number;
    amount: number;
    estimatedTime: number;
    status: string;
    createdAt: string;
  };
  Customer: {
    name: string;
    rating: number;
  };
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketInitialized, setSocketInitialized] = useState(false);
  const router = useRouter();

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
    loadOrders();
  }, []);

  useEffect(() => {
    if (!socketInitialized) return;

    const socket = getSocket();

    socket.on('new_order_request', (newOrder: Order) => {
      setOrders(prev => [newOrder, ...prev]);
      // Show notification for new order
      Alert.alert(
        'New Order Request',
        `New ${newOrder.Service.name} service request received!`,
        [
          {
            text: 'View',
            onPress: () => handleOrderPress(newOrder)
          },
          {
            text: 'Later',
            style: 'cancel'
          }
        ]
      );
    });

    socket.on('bid_status_changed', (data: { orderId: number, status: string }) => {
      setOrders(prev => prev.map(order => 
        order.id === data.orderId
          ? { 
              ...order, 
              Bid: order.Bid ? { ...order.Bid, status: data.status } : undefined,
              status: data.status === 'accepted' ? 'assigned' : order.status
            }
          : order
      ));
    });

    socket.on('order_cancelled', (orderId: number) => {
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: 'cancelled', biddingStatus: 'closed' }
          : order
      ));
      Alert.alert('Order Cancelled', 'The customer has cancelled this order.');
    });

    return () => {
      socket.off('new_order_request');
      socket.off('bid_status_changed');
      socket.off('order_cancelled');
    };
  }, [socketInitialized]);

  const loadOrders = async () => {
    try {
      const response = await ApiService.get('/orders/vendor');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return 'Bidding ended';

    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} left`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleOrderPress = (order: Order) => {
    if (order.status === 'cancelled' || order.biddingStatus === 'closed') {
      Alert.alert('Order Unavailable', 'This order is no longer accepting bids.');
      return;
    }

    if (order.Bid) {
      // Show bid details with more options
      Alert.alert(
        'Bid Details',
        `Amount: Rs. ${order.Bid.amount}\nEstimated Time: ${order.Bid.estimatedTime} minutes\nStatus: ${order.Bid.status}\nSubmitted: ${formatTimeAgo(order.Bid.createdAt)}`,
        [
          {
            text: 'Update Bid',
            onPress: () => router.push({
              pathname: '/(tabs)/BidScreen',
              params: { orderId: order.id, mode: 'update' }
            })
          },
          {
            text: 'Close',
            style: 'cancel'
          }
        ]
      );
    } else {
      // Navigate to bid screen
      router.push({
        pathname: '/(tabs)/BidScreen',
        params: { orderId: order.id }
      });
    }
  };

  const renderOrder = ({ item: order }: { item: Order }) => (
    <TouchableOpacity 
      style={[
        styles.orderCard,
        order.status === 'cancelled' && styles.cancelledOrder
      ]}
      onPress={() => handleOrderPress(order)}
      disabled={order.status === 'cancelled'}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.serviceType}>{order.Service.name}</Text>
          <Text style={styles.orderTime}>{formatTimeAgo(order.createdAt)}</Text>
        </View>
        {order.Bid ? (
          <View style={[
            styles.statusBadge,
            order.Bid.status === 'accepted' && styles.statusAccepted,
            order.Bid.status === 'rejected' && styles.statusRejected
          ]}>
            <Text style={[
              styles.statusText,
              order.Bid.status === 'accepted' && styles.statusAcceptedText,
              order.Bid.status === 'rejected' && styles.statusRejectedText
            ]}>
              {order.Bid.status}
            </Text>
          </View>
        ) : order.status === 'cancelled' ? (
          <View style={[styles.statusBadge, styles.statusCancelled]}>
            <Text style={[styles.statusText, styles.statusCancelledText]}>Cancelled</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>New Request</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{order.description}</Text>
      
      <View style={styles.customerInfo}>
        <Ionicons name="person-circle-outline" size={16} color="#666B8F" />
        <Text style={styles.customerName}>{order.Customer.name}</Text>
        {order.Customer.rating > 0 && (
          <>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.customerRating}>{order.Customer.rating.toFixed(1)}</Text>
          </>
        )}
      </View>

      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={16} color="#666B8F" />
        <Text style={styles.location}>{order.location.address}</Text>
      </View>

      {order.biddingStatus === 'open' && (
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color="#666B8F" />
          <Text style={styles.timerText}>
            {formatTimeLeft(order.biddingEndTime)}
          </Text>
        </View>
      )}

      {order.Bid && (
        <View style={styles.bidInfo}>
          <Text style={styles.bidAmount}>Rs. {order.Bid.amount}</Text>
          <Text style={styles.estimatedTime}>{order.Bid.estimatedTime} minutes</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E60FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4E60FF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#666B8F" />
            <Text style={styles.emptyText}>No orders available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelledOrder: {
    opacity: 0.7,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2243',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: '#666B8F',
  },
  statusBadge: {
    backgroundColor: '#E8E8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAccepted: {
    backgroundColor: '#E8FFE8',
  },
  statusRejected: {
    backgroundColor: '#FFE8E8',
  },
  statusCancelled: {
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    color: '#4E60FF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusAcceptedText: {
    color: '#4CAF50',
  },
  statusRejectedText: {
    color: '#FF4E4E',
  },
  statusCancelledText: {
    color: '#666B8F',
  },
  description: {
    fontSize: 16,
    color: '#1E2243',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    color: '#1E2243',
    marginLeft: 8,
    marginRight: 12,
  },
  customerRating: {
    fontSize: 14,
    color: '#666B8F',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666B8F',
    marginLeft: 8,
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8F9FF',
    padding: 8,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#666B8F',
    marginLeft: 8,
    fontWeight: '500',
  },
  bidInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E60FF',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666B8F',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666B8F',
    marginTop: 16,
  },
}); 