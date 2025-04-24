import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
const LOCATION_TRACKING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SIGNIFICANT_DISTANCE = 100; // 100 meters

class LocationService {
  static locationSubscription: any = null;

  static async requestPermissions() {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Permission to access location was denied');
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    return {
      foreground: foregroundStatus === 'granted',
      background: backgroundStatus === 'granted'
    };
  }

  static async startLocationUpdates() {
    try {
      const permissions = await this.requestPermissions();

      // Start foreground updates
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_TRACKING_INTERVAL,
          distanceInterval: SIGNIFICANT_DISTANCE,
        },
        (location) => this.updateLocation(location, 'foreground')
      );

      // Start background updates if permitted
      if (permissions.background) {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_TRACKING_INTERVAL,
          distanceInterval: SIGNIFICANT_DISTANCE,
          foregroundService: {
            notificationTitle: "Location Tracking",
            notificationBody: "Tracking location for service requests"
          }
        });
      }
    } catch (error) {
      console.error('Error starting location updates:', error);
    }
  }

  static async stopLocationUpdates() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
    }
    if (TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  }

  static async updateLocation(location: Location.LocationObject, source: 'foreground' | 'background' | 'event') {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await ApiService.post('/vendors/location/update', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        source
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  static async getCurrentLocation() {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    await this.updateLocation(location, 'event');
    return location;
  }
}

// Define background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    await LocationService.updateLocation(locations[0], 'background');
  }
});

export default LocationService; 