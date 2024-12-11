import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import OCRService from '../services/ocrService';

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
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [cnicDetails, setCnicDetails] = useState<any>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const processCNICImage = async (imageUri: string) => {
    setOcrProcessing(true);
    try {
      const result = await OCRService.extractCNICDetails(imageUri);
      console.log('Processed CNIC Details:', result);
      
      if (result.success && result.details) {
        // Store CNIC details for later upload
        setCnicDetails(result.details);
        
        // Show extracted details to user
        Alert.alert(
          'CNIC Details Extracted',
          `Name: ${result.details.name}\n` +
          `CNIC: ${result.details.identityNumber}\n` +
          `Father's Name: ${result.details.fatherName}\n` +
          `Date of Birth: ${result.details.dateOfBirth}\n` +
          `Date of Expiry: ${result.details.dateOfExpiry}\n` +
          `Gender: ${result.details.gender}`,
          [{ text: 'OK' }]
        );
        
        return result.details;
      } else {
        Alert.alert(
          'Retry Needed',
          'Could not read CNIC details. Please ensure:\n\n' +
          '• CNIC is well-lit\n' +
          '• Text is clearly visible\n' +
          '• Camera is focused on the text\n' +
          '• CNIC is properly aligned'
        );
        return null;
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert(
        'OCR Error',
        'Failed to process the image. Please try again with better lighting and focus.'
      );
      return null;
    } finally {
      setOcrProcessing(false);
    }
  };

  const takePicture = async (side: 'front' | 'back') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: true,
        allowsEditing: true,
        aspect: [3, 2], // CNIC aspect ratio
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Captured image info:', {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileSize: asset.fileSize
        });

        if (side === 'front') {
          setIsLoading(true);
          try {
            console.log('Processing front image...');
            const details = await processCNICImage(asset.uri);
            
            if (details) {
              setFrontImage({
                uri: asset.uri,
                type: 'image/jpeg',
                base64: asset.base64 || null,
              });
            }
          } finally {
            setIsLoading(false);
          }
        } else {
          setBackImage({
            uri: asset.uri,
            type: 'image/jpeg',
            base64: asset.base64 || null,
          });
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        'Error',
        'Failed to process image. Please try again with better lighting and focus.'
      );
    }
  };

  const formatDateForBackend = (dateStr: string) => {
    // Convert from DD.MM.YYYY to YYYY-MM-DD
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month}-${day}`;
  };

  const uploadImages = async () => {
    if (!frontImage || !backImage || !cnicDetails) {
      Alert.alert('Error', 'Please capture both sides of your CNIC');
      return;
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const formData = new FormData();

      // Append images with correct field names
      formData.append('frontImage', {
        uri: frontImage.uri,
        type: 'image/jpeg',
        name: 'frontImage.jpg'
      } as any);
      
      formData.append('backImage', {
        uri: backImage.uri,
        type: 'image/jpeg',
        name: 'backImage.jpg'
      } as any);

      // Format dates and prepare CNIC details
      const parsedCnicDetails = {
        identityNumber: cnicDetails.identityNumber?.replace(/\s+/g, ''), // Remove any spaces
        name: cnicDetails.name?.trim(),
        fatherName: cnicDetails.fatherName?.trim(),
        dateOfBirth: formatDateForBackend(cnicDetails.dateOfBirth),
        dateOfExpiry: formatDateForBackend(cnicDetails.dateOfExpiry),
        gender: cnicDetails.gender?.trim()
      };

      // Validate before sending
      if (!parsedCnicDetails.identityNumber || 
          !parsedCnicDetails.name ||
          !parsedCnicDetails.fatherName ||
          !parsedCnicDetails.dateOfBirth ||
          !parsedCnicDetails.dateOfExpiry ||
          !parsedCnicDetails.gender) {
        throw new Error('Missing required CNIC details');
      }

      // Validate CNIC format (should be like 42201-8345146-7)
      if (!/^\d{5}-\d{7}-\d$/.test(parsedCnicDetails.identityNumber)) {
        throw new Error('Invalid CNIC number format');
      }

      // Log the data being sent
      console.log('Sending CNIC details:', parsedCnicDetails);
      
      // Append CNIC details as a string
      formData.append('cnicDetails', JSON.stringify(parsedCnicDetails));

      try {
        const response = await ApiService.post('/users/upload-cnic', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        console.log('Upload response status:', response.status);
        
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
          throw new Error('Failed to upload CNIC');
        }
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert(
          'Upload Failed',
          error instanceof Error ? error.message : 'Failed to upload CNIC. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error preparing upload:', error);
      Alert.alert(
        'Upload Failed', 
        error instanceof Error ? error.message : 'Failed to prepare upload. Please try again.'
      );
    } finally {
      setIsLoading(false);
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