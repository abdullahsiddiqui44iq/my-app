import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

type ImageAsset = {
  uri: string;
  base64?: string | null;
};

type ImageInfo = {
  uri: string;
  type: string;
  base64?: string | null;
} | null;

// Loading Overlay Component
const LoadingOverlay = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible}>
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E60FF" />
          <Text style={styles.loadingText}>Uploading CNIC Images...</Text>
          <Text style={styles.loadingSubText}>Please wait while we process your verification</Text>
        </View>
      </View>
    </Modal>
  );
};

export default function CNICVerificationScreen() {
  const [frontImage, setFrontImage] = useState<ImageInfo>(null);
  const [backImage, setBackImage] = useState<ImageInfo>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async (side: 'front' | 'back') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset: ImageAsset = result.assets[0];
        const imageInfo: ImageInfo = {
          uri: asset.uri,
          type: 'image/jpeg',
          base64: asset.base64 || null,
        };
        
        if (side === 'front') {
          setFrontImage(imageInfo);
        } else {
          setBackImage(imageInfo);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
      console.error('Camera error:', error);
    }
  };

  const uploadImages = async () => {
    if (!frontImage || !backImage) {
      Alert.alert('Error', 'Please capture both sides of your CNIC');
      return;
    }

    setIsLoading(true); // Start loading

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const formData = new FormData();

      formData.append('frontImage', {
        uri: frontImage.uri,
        type: 'image/jpeg',
        name: 'front_cnic.jpg',
        size: undefined,
        lastModified: undefined,
        lastModifiedDate: undefined,
        path: undefined,
        webkitRelativePath: undefined
      } as any);
      
      formData.append('backImage', {
        uri: backImage.uri,
        type: 'image/jpeg',
        name: 'back_cnic.jpg',
        size: undefined,
        lastModified: undefined,
        lastModifiedDate: undefined,
        path: undefined,
        webkitRelativePath: undefined
      } as any);

      console.log('Uploading images...', { frontUri: frontImage.uri, backUri: backImage.uri });

      const response = await ApiService.post('/users/upload-cnic', formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('Upload response status:', response.status);
      const responseData = await response.json();
      console.log('Upload response:', responseData);

      if (response.ok) {
        Alert.alert(
          'Success',
          'Your CNIC images have been uploaded. Your account is under review and will be activated within 24 hours.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('WelcomeScreen' as never),
            },
          ]
        );
      } else {
        throw new Error(responseData.error || 'Failed to upload images');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload images. Please try again.');
      console.error('Error uploading:', error);
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CNIC Verification</Text>
      <Text style={styles.subtitle}>
        Please provide clear pictures of your CNIC (front and back)
      </Text>

      <View style={styles.imageContainer}>
        {/* Front CNIC */}
        <View style={styles.cnicSection}>
          <Text style={styles.sectionTitle}>Front Side</Text>
          {frontImage ? (
            <Image source={{ uri: frontImage.uri }} style={styles.preview} />
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => takePicture('front')}
            >
              <Ionicons name="camera" size={40} color="#4E60FF" />
              <Text style={styles.captureText}>Take Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back CNIC */}
        <View style={styles.cnicSection}>
          <Text style={styles.sectionTitle}>Back Side</Text>
          {backImage ? (
            <Image source={{ uri: backImage.uri }} style={styles.preview} />
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => takePicture('back')}
            >
              <Ionicons name="camera" size={40} color="#4E60FF" />
              <Text style={styles.captureText}>Take Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!frontImage || !backImage || isLoading) && styles.submitButtonDisabled,
        ]}
        onPress={uploadImages}
        disabled={!frontImage || !backImage || isLoading}
      >
        <Text style={styles.submitButtonText}>
          Submit for Verification
        </Text>
      </TouchableOpacity>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2243',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666B8F',
    marginBottom: 30,
  },
  imageContainer: {
    flex: 1,
    gap: 20,
  },
  cnicSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2243',
    marginBottom: 10,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
  },
  captureButton: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4E60FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: {
    color: '#4E60FF',
    marginTop: 10,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#4E60FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#A0A3BD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2243',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666B8F',
    textAlign: 'center',
  },
}); 