import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import ApiService from '../services/api';

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
    serviceArea: number;
    vendorCategoryId: number;
  };
};

interface VendorCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export default function RegisterScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serviceArea, setServiceArea] = useState(5); // Default 5km
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [vendorCategory, setVendorCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [hasSmartphone, setHasSmartphone] = useState(true);
  const [phoneForCalls, setPhoneForCalls] = useState('');

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

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await ApiService.get('/users/vendor-categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again later.');
    }
  };

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
      const isDevelopment = false;
      const API_URL = 'http://192.168.69.216:3000';

      // Always send verification code request first
      const response = await ApiService.post('/users/send-verification-code', { 
        phone: phoneNumber 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification code');
      }

      // After successful verification code storage, navigate to verification screen
      navigation.navigate('VerificationScreen', { 
        name, 
        phoneNumber, 
        password, 
        location,
        role: 'vendor',
        serviceArea,
        vendorCategoryId: parseInt(vendorCategory)
      });

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

            {/* Service Category Selector */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.label}>Service Category</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => {
                  console.log('Dropdown pressed');
                  setShowCategoryDropdown(!showCategoryDropdown);
                }}
              >
                <Text style={styles.categoryText}>
                  {vendorCategory ? categories.find(c => c.id.toString() === vendorCategory)?.name : 'Select your service'}
                </Text>
                <Ionicons 
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666B8F" 
                />
              </TouchableOpacity>

              {showCategoryDropdown && (
                <View style={styles.dropdownList}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        console.log('Category selected:', category.name);
                        setVendorCategory(category.id.toString());
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        vendorCategory === category.id.toString() && styles.selectedItemText
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Service Area Selector */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.label}>Service Area Radius</Text>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.serviceAreaValue}>{serviceArea} km</Text>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={1}
                  maximumValue={20}
                  step={1}
                  value={serviceArea}
                  onValueChange={setServiceArea}
                  minimumTrackTintColor="#4E60FF"
                  maximumTrackTintColor="#E2E4ED"
                  thumbTintColor="#4E60FF"
                />
                <Text style={styles.serviceAreaHint}>
                  Select the radius within which you'll provide services
                </Text>
              </View>
            </View>

            {/* Smartphone Option */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.label}>Do you have a smartphone?</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={[
                    styles.radioButton, 
                    hasSmartphone && styles.radioButtonSelected
                  ]}
                  onPress={() => setHasSmartphone(true)}
                >
                  <Text style={[
                    styles.radioText,
                    hasSmartphone && styles.radioTextSelected
                  ]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.radioButton, 
                    !hasSmartphone && styles.radioButtonSelected
                  ]}
                  onPress={() => setHasSmartphone(false)}
                >
                  <Text style={[
                    styles.radioText,
                    !hasSmartphone && styles.radioTextSelected
                  ]}>No</Text>
                </TouchableOpacity>
              </View>
              {!hasSmartphone && (
                <View style={styles.phoneInput}>
                  <Text style={styles.label}>Phone Number for Calls</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneForCalls}
                    onChangeText={setPhoneForCalls}
                    placeholder="Enter phone number for receiving calls"
                    keyboardType="phone-pad"
                  />
                </View>
              )}
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

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E2243',
    marginBottom: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E4ED',
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryText: {
    fontSize: 16,
    color: '#1E2243',
  },
  dropdownList: {
    marginTop: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E4ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E4ED',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1E2243',
  },
  selectedItemText: {
    color: '#4E60FF',
    fontWeight: '600',
  },
  serviceAreaValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4E60FF',
    marginBottom: 8,
  },
  serviceAreaHint: {
    fontSize: 12,
    color: '#666B8F',
    textAlign: 'center',
    marginTop: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4ED',
  },
  radioButtonSelected: {
    backgroundColor: '#4E60FF',
    borderColor: '#4E60FF',
  },
  radioText: {
    color: '#666B8F',
    fontSize: 16,
  },
  radioTextSelected: {
    color: '#FFFFFF',
  },
  phoneInput: {
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E4ED',
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E2243',
  }
});