declare module '@expo/vector-icons';
declare module '@react-navigation/native';
declare module '@react-native-async-storage/async-storage';
declare module 'react-native-mlkit-ocr';

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL: string;
  }
} 