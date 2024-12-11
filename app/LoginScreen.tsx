import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api'; 

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const response = await ApiService.post('/users/login', {
        phone: phoneNumber,
        password: password,
        role: 'vendor'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));

      if (data.redirectTo) {
        console.log('Redirecting to:', data.redirectTo);
        router.replace(`/${data.redirectTo}`);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      Alert.alert('Error', errorMessage);
      console.error('Login error:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FF" />
      
      {/* Header Section */}
      <View style={{ 
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20
      }}>
        <Text style={{ 
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1E2243',
          marginBottom: 8
        }}>
          Welcome Back!
        </Text>
        <Text style={{ 
          fontSize: 16,
          color: '#666B8F',
          lineHeight: 24
        }}>
          Sign in to continue providing services
        </Text>
      </View>

      {/* Form Section */}
      <View style={{ 
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5
      }}>
        {/* Phone Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 14,
            fontWeight: '600',
            color: '#1E2243',
            marginBottom: 8
          }}>Phone Number</Text>
          <View style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E4ED',
            borderRadius: 12,
            backgroundColor: '#F8F9FF',
            paddingHorizontal: 16
          }}>
            <Ionicons name="call-outline" size={20} color="#666B8F" />
            <TextInput
              style={{ 
                flex: 1,
                height: 50,
                marginLeft: 12,
                fontSize: 16,
                color: '#1E2243'
              }}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholderTextColor="#A0A3BD"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 14,
            fontWeight: '600',
            color: '#1E2243',
            marginBottom: 8
          }}>Password</Text>
          <View style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E4ED',
            borderRadius: 12,
            backgroundColor: '#F8F9FF',
            paddingHorizontal: 16
          }}>
            <Ionicons name="lock-closed-outline" size={20} color="#666B8F" />
            <TextInput
              style={{ 
                flex: 1,
                height: 50,
                marginLeft: 12,
                fontSize: 16,
                color: '#1E2243'
              }}
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#A0A3BD"
            />
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#4E60FF',
            paddingVertical: 16,
            borderRadius: 12,
            shadowColor: '#4E60FF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5
          }}
          onPress={handleLogin}
        >
          <Text style={{ 
            color: '#FFFFFF',
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '600'
          }}>Sign In</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={{ 
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 24
        }}>
          <Text style={{ color: '#666B8F' }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/RegisterScreen')}>
            <Text style={{ color: '#4E60FF', fontWeight: '600' }}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}