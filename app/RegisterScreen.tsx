import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
type RootStackParamList = {
  WelcomeScreen: undefined;
  HomeScreen: undefined;
  VerificationScreen: {
    name: string;
    phoneNumber: string;
    password: string;
    location: Location.LocationObject;
    role: string;
    testCode?: string;
  };
};

export default function RegisterScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission to access location was denied');
          navigation.navigate('WelcomeScreen'); // Navigate back to WelcomeScreen
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        console.log(location);
      } catch (error) {
        Alert.alert('Error', 'Location request failed. Please check your device settings.');
        navigation.navigate('WelcomeScreen'); // Navigate back to WelcomeScreen
      }
    };

    requestLocationPermission();
  }, [navigation]);

  const handleSendVerificationCode = async () => {
    if (!name || !phoneNumber || !password || !confirmPassword || !location) {
      Alert.alert('Please fill all fields and allow location access');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password must be at least 6 characters long');
      return;
    }
    if (!/\d/.test(password)) {
      Alert.alert('Password must contain at least one number');
      return;
    }

    try {
      const isDevelopment = false; // Set to true to bypass API call

      if (isDevelopment) {
        navigation.navigate('VerificationScreen', { 
          name, 
          phoneNumber, 
          password, 
          location, 
          role: 'vendor',
          testCode: '1234' 
        });
        return;
      }

      const API_URL = 'http://192.168.18.171:3000'; // Replace X with your actual IP
      const response = await fetch(`${API_URL}/api/users/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      if (response.ok) {
        navigation.navigate('VerificationScreen', { 
          name, 
          phoneNumber, 
          password, 
          location, 
          role: 'vendor' 
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification code');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while sending the verification code. Please try again.');
      console.error('Error details:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FF" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1 }}>
          {/* Header Section */}
          <View style={{ 
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 10
          }}>
            <Text style={{ 
              fontSize: 28,
              fontWeight: 'bold',
              color: '#1E2243',
              marginBottom: 8
            }}>
              Service Provider Registration
            </Text>
            <Text style={{ 
              fontSize: 16,
              color: '#666B8F',
              lineHeight: 24
            }}>
              Join our network of trusted professionals
            </Text>
          </View>

          {/* Image Section */}
          <View style={{ 
            alignItems: 'center',
            marginVertical: 20,
            paddingHorizontal: 24
          }}>
            <Image
              source={require('../assets/images/register.png')}
              style={{ 
                width: '80%',
                height: 200,
                resizeMode: 'contain'
              }}
            />
          </View>

          {/* Form Section */}
          <View style={{ 
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
            {/* Name Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 14,
                fontWeight: '600',
                color: '#1E2243',
                marginBottom: 8
              }}>Full Name</Text>
              <View style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E4ED',
                borderRadius: 12,
                backgroundColor: '#F8F9FF',
                paddingHorizontal: 16
              }}>
                <Ionicons name="person-outline" size={20} color="#666B8F" />
                <TextInput
                  style={{ 
                    flex: 1,
                    height: 50,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#1E2243'
                  }}
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#A0A3BD"
                />
              </View>
            </View>

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
            <View style={{ marginBottom: 16 }}>
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
                  placeholder="Create password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#A0A3BD"
                />
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                fontSize: 14,
                fontWeight: '600',
                color: '#1E2243',
                marginBottom: 8
              }}>Confirm Password</Text>
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
                  placeholder="Confirm password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholderTextColor="#A0A3BD"
                />
              </View>
            </View>

            {/* Submit Button */}
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
              onPress={handleSendVerificationCode}
            >
              <Text style={{ 
                color: '#FFFFFF',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '600'
              }}>Continue</Text>
            </TouchableOpacity>

            {/* Location Status */}
            <View style={{ 
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16
            }}>
              <Ionicons 
                name={location ? "location" : "location-outline"} 
                size={16} 
                color={location ? "#4CAF50" : "#666B8F"} 
              />
              <Text style={{ 
                marginLeft: 8,
                color: location ? "#4CAF50" : "#666B8F",
                fontSize: 14
              }}>
                {location ? "Location accessed" : "Accessing location..."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}