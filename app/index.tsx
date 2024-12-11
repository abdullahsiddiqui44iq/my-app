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
      
      // If no token or userData, go to welcome screen
      if (!token || !userData) {
        router.replace('/WelcomeScreen');
        return;
      }

      const user = JSON.parse(userData);
      
      // If not a vendor, go to welcome screen
      if (user.role !== 'vendor') {
        router.replace('/WelcomeScreen');
        return;
      }

      // If vendor data is missing, clear storage and go to welcome screen
      if (!user.vendor) {
        await AsyncStorage.clear();
        router.replace('/WelcomeScreen');
        return;
      }

      // Check vendor status
      if (user.vendor.verificationStatus === 'approved' && 
          user.vendor.backgroundCheckStatus === 'passed' && 
          user.vendor.registrationStatus === 'complete') {
        router.replace('/(tabs)');
        return;
      }

      // If registration is incomplete, go to CNIC verification
      // if (user.vendor.registrationStatus === 'incomplete') {
      //   router.replace('/CNICVerificationScreen');
      //   return;
      // }

      // Default fallback to welcome screen
      await AsyncStorage.clear(); // Clear any inconsistent state
      router.replace('/WelcomeScreen');
    } catch (error) {
      console.error('Auth check error:', error);
      await AsyncStorage.clear(); // Clear on error
      router.replace('/WelcomeScreen');
    }
  };

  return null;
} 