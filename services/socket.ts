import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/env';

let socket: Socket | null = null;

export const initializeSocket = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No token found for socket connection');
      return;
    }

    console.log('Initializing socket connection...');
    
    socket = io(API_URL, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
      
      // Join vendor room
      const vendorId = getVendorId();
      if (vendorId) {
        console.log('Joining vendor room:', vendorId);
        socket?.emit('join_vendor_room', { vendorId });
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });

    // Vendor-specific event listeners
    socket.on('vendor_status_changed', (data: { isAvailable: boolean }) => {
      console.log('Vendor status changed:', data);
    });

    // New order request
    socket.on('new_order_request', (order: any) => {
      console.log('New order request received:', order);
      // Emit event to update UI
      socket?.emit('order_request_received', order);
    });

    // Bid acceptance
    socket.on('bid_accepted', (data: { orderId: number, bidId: number }) => {
      console.log('Bid accepted:', data);
      // Emit event to update UI
      socket?.emit('bid_status_changed', { ...data, status: 'accepted' });
    });

    // Bid rejection
    socket.on('bid_rejected', (data: { orderId: number, bidId: number }) => {
      console.log('Bid rejected:', data);
      // Emit event to update UI
      socket?.emit('bid_status_changed', { ...data, status: 'rejected' });
    });

    // Order cancellation
    socket.on('order_cancelled', (orderId: number) => {
      console.log('Order cancelled:', orderId);
      // Emit event to update UI
      socket?.emit('order_status_changed', { orderId, status: 'cancelled' });
    });

    // Bid timer updates
    socket.on('bid_timer_tick', (data: { orderId: number, remainingTime: number, isExpired: boolean }) => {
      console.log('Bid timer update:', data);
      // Emit event to update UI
      socket?.emit('timer_updated', data);
    });

  } catch (error) {
    console.error('Socket initialization error:', error);
  }
};

const getVendorId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('vendorId');
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Vendor-specific socket methods
export const submitBid = (orderId: number, bidData: { amount: number, estimatedTime: number, message?: string }) => {
  const socket = getSocket();
  socket.emit('submit_bid', { orderId, ...bidData });
};

export const updateVendorStatus = (isAvailable: boolean) => {
  const socket = getSocket();
  socket.emit('vendor_status_update', { isAvailable });
};

export const joinOrderRoom = (orderId: number) => {
  const socket = getSocket();
  socket.emit('join_order_room', orderId);
};

export const leaveOrderRoom = (orderId: number) => {
  const socket = getSocket();
  socket.emit('leave_order_room', orderId);
}; 