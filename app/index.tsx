import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // For testing: uncomment this line to clear storage
      // await AsyncStorage.clear();

      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        router.replace('/WelcomeScreen');
        return;
      }

      const user = JSON.parse(userData);
      if (user.role === 'vendor') {
        const vendor = user.vendor;
        if (!vendor) {
          router.replace('/WelcomeScreen');
          return;
        }

        if (vendor.registrationStatus === 'incomplete') {
          router.replace('/CNICVerificationScreen');
          return;
        }

        if (vendor.verificationStatus === 'approved' && 
            vendor.backgroundCheckStatus === 'passed' && 
            vendor.registrationStatus === 'complete') {
          router.replace('/(tabs)');
          return;
        }
      }
      
      router.replace('/WelcomeScreen');
    } catch (error) {
      router.replace('/WelcomeScreen');
    }
  };

  return null;
} 