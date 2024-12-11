import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

type RouteParams = {
  name: string;
  phoneNumber: string;
  password: string;
  location: any;
  role: string;
  serviceArea: number;
  vendorCategoryId: number;
  servicePrices: Array<{
    serviceId: number;
    price: number;
  }>;
  hasSmartphone: boolean;
  phoneForCalls: string;
};

export default function VerificationScreen() {
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const navigation = useNavigation();
  const route = useRoute();
  const { name, phoneNumber, password, location, role, serviceArea, vendorCategoryId, servicePrices, hasSmartphone, phoneForCalls } = route.params as RouteParams;
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const handleVerifyCode = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter a 4-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = { 
        name, 
        phone: phoneNumber, 
        password, 
        location,
        role, 
        code: verificationCode,
        serviceArea,
        vendorCategoryId,
        servicePrices,
        hasSmartphone,
        phoneForCalls
      };

      console.log('Sending verification request with data:', requestData);

      const response = await ApiService.post('/users/verify-code-and-create-user', requestData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      const responseData = await response.json();
      await AsyncStorage.setItem('userToken', responseData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(responseData.user));

      Alert.alert('Success', 'User verified. Please complete CNIC verification.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('CNICVerificationScreen' as never);
          }
        }
      ]);
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during verification');
      console.error('Error details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Verification code resent');
        setTimer(60);
      } else {
        Alert.alert('Error', 'Failed to resend verification code');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while resending the verification code');
    }
  };

  const handleInputChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) {
      const nextInput = inputRefs.current[index + 1];
      nextInput?.focus();
    }
    if (!text && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      prevInput?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FF" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          Please enter the 4-digit code sent to{'\n'}
          <Text style={styles.phoneText}>{phoneNumber}</Text>
        </Text>
      </View>

      {/* Code Input Section */}
      <View style={styles.codeSection}>
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <View key={index} style={styles.inputWrapper}>
              <TextInput
                ref={(input) => (inputRefs.current[index] = input)}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleInputChange(text, index)}
                selectionColor="#4E60FF"
              />
            </View>
          ))}
        </View>

        {/* Timer and Resend Section */}
        <View style={styles.timerContainer}>
          <Ionicons 
            name="time-outline" 
            size={20} 
            color={timer === 0 ? '#666B8F' : '#4E60FF'} 
          />
          {timer === 0 ? (
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerNumber}>{timer}s</Text>
            </Text>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity 
          style={styles.verifyButton} 
          onPress={handleVerifyCode}
        >
          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
        </TouchableOpacity>

        {/* Help Text */}
        <TouchableOpacity style={styles.helpContainer}>
          <Ionicons name="help-circle-outline" size={20} color="#666B8F" />
          <Text style={styles.helpText}>Didn't receive the code?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E2243',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666B8F',
    lineHeight: 24,
  },
  phoneText: {
    color: '#4E60FF',
    fontWeight: '600',
  },
  codeSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  inputWrapper: {
    width: 65,
    height: 65,
    borderRadius: 16,
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#E2E4ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E2243',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  resendText: {
    color: '#4E60FF',
    fontSize: 16,
    fontWeight: '600',
  },
  timerText: {
    color: '#666B8F',
    fontSize: 16,
  },
  timerNumber: {
    color: '#4E60FF',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#4E60FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 40,
    shadowColor: '#4E60FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  helpText: {
    color: '#666B8F',
    fontSize: 14,
  },
});