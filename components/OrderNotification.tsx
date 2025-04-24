import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderNotificationProps {
  order: {
    id: number;
    serviceName: string;
    description: string;
    distance: number;
    location: {
      address: string;
    };
  };
  onAccept: () => void;
  onDecline: () => void;
}

export default function OrderNotification({ order, onAccept, onDecline }: OrderNotificationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="notifications" size={24} color="#4E60FF" />
          <Text style={styles.title}>New Service Request</Text>
        </View>
        
        <Text style={styles.serviceName}>{order.serviceName}</Text>
        <Text style={styles.description}>{order.description}</Text>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#666B8F" />
            <Text style={styles.detailText}>{order.distance.toFixed(1)} km away</Text>
          </View>
          <Text style={styles.address}>{order.location.address}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptText}>Place Bid</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: Dimensions.get('window').height,
    justifyContent: 'flex-start',
    paddingTop: 50,
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E2243',
    marginLeft: 8,
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
    marginBottom: 12,
  },
  details: {
    backgroundColor: '#F5F7FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    color: '#666B8F',
  },
  address: {
    color: '#1E2243',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4E60FF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#FFE8E8',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  declineText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '600',
  },
}); 