import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    }); 
  }

  if (!Device.isDevice) {
    Alert.alert('Must use a physical device for push notifications');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Failed to get push token for push notification!');
    return;
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'a9507c6c-afa1-4b44-a1ed-3c843e468fbb' // Using projectId instead of experienceId
    })).data;
  } catch (error) {
    console.error('Error getting push token:', error);
    Alert.alert('Error', 'Failed to get push notification token');
  }

  return token;
}