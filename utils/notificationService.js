import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification keys for AsyncStorage
const NOTIFICATION_IDS_KEY = '@spotify_crapped_notification_ids';
const NOTIFICATION_STATUS_KEY = '@spotify_crapped_notification_status';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission for push notifications
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    console.log('Notifications are not supported in web platform');
    return false;
  }

  // Just request permission for local notifications without trying to get a push token
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get permission for notifications');
      return false;
    }

    // Required for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1DB954', // Spotify green
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Save notification IDs to AsyncStorage
 * @param {Object} ids - Object with notification IDs
 */
async function saveNotificationIds(ids) {
  try {
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving notification IDs:', error);
  }
}

/**
 * Get saved notification IDs from AsyncStorage
 * @returns {Promise<Object>} - Object with notification IDs
 */
async function getNotificationIds() {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    return value ? JSON.parse(value) : {};
  } catch (error) {
    console.error('Error getting notification IDs:', error);
    return {};
  }
}

/**
 * Save notification status to AsyncStorage
 * @param {boolean} enabled - Whether notifications are enabled
 */
export async function saveNotificationStatus(enabled) {
  try {
    await AsyncStorage.setItem(NOTIFICATION_STATUS_KEY, JSON.stringify({ enabled }));
  } catch (error) {
    console.error('Error saving notification status:', error);
  }
}

/**
 * Get current notification status from AsyncStorage
 * @returns {Promise<boolean>} - Whether notifications are enabled
 */
export async function getNotificationStatus() {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATION_STATUS_KEY);
    return value ? JSON.parse(value).enabled : false;
  } catch (error) {
    console.error('Error getting notification status:', error);
    return false;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await saveNotificationIds({});
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

/**
 * Gets the date for the first day of next month
 * @returns {Date} Date object for first day of next month
 */
function getFirstDayOfNextMonth() {
  const now = new Date();
  // Get the first day of the next month
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Creates a date object for a notification that's in the future
 * In development mode, adds a delay to prevent immediate firing
 * @param {Date} targetDate - The intended target date
 * @returns {Date} A date guaranteed to be in the future
 */
function createFutureDate(targetDate) {
  const now = new Date();
  
  // If we're in development/testing mode
  if (__DEV__) {
    // Create a test date just a bit in the future (30 seconds from now)
    // instead of using the real target date
    const testDate = new Date(now.getTime() + 30000); // 30 seconds in the future
    console.log(`Development mode: Using test date instead of ${targetDate.toLocaleString()}`);
    return testDate;
  }
  
  // In production, ensure the date is in the future
  if (targetDate <= now) {
    // If target date is in the past, move to next month
    targetDate.setMonth(targetDate.getMonth() + 1);
  }
  
  return targetDate;
}

/**
 * Schedule a notification for the morning of the first day of each month
 */
export async function scheduleFirstDayNotification() {
  try {
    // Cancel any existing first day notification
    const ids = await getNotificationIds();
    if (ids.firstDay) {
      await Notifications.cancelScheduledNotificationAsync(ids.firstDay);
    }

    // Schedule for 9:00 AM on the first day of next month
    const firstDayDate = getFirstDayOfNextMonth();
    firstDayDate.setHours(9, 0, 0, 0);
    
    // Ensure the date is in the future and handle development mode
    const scheduledDate = createFutureDate(firstDayDate);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎵 New Spotify Crapped Available!',
        body: 'Your monthly music stats are ready. See what you\'ve been listening to!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'first_day' },
      },
      trigger: {
        date: scheduledDate,
        repeats: false,
      },
    });

    // Save the notification ID
    ids.firstDay = notificationId;
    await saveNotificationIds(ids);

    console.log('First day notification scheduled for:', scheduledDate.toLocaleString());
    return notificationId;
  } catch (error) {
    console.error('Error scheduling first day notification:', error);
    return null;
  }
}

/**
 * Schedule a notification for 2 days before the first week ends
 */
export async function scheduleTwoDaysBeforeEndNotification() {
  try {
    // Cancel any existing notification
    const ids = await getNotificationIds();
    if (ids.twoDaysBefore) {
      await Notifications.cancelScheduledNotificationAsync(ids.twoDaysBefore);
    }

    // Schedule for 5:00 PM on the 5th day of next month (2 days before week ends)
    const targetDate = getFirstDayOfNextMonth();
    targetDate.setDate(5);
    targetDate.setHours(17, 0, 0, 0);

    // Ensure the date is in the future and handle development mode
    const scheduledDate = createFutureDate(targetDate);
    
    // In development mode, add a small delay to separate test notifications
    if (__DEV__) {
      scheduledDate.setSeconds(scheduledDate.getSeconds() + 5); // Add 5 more seconds
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Last Chance for Spotify Crapped',
        body: 'Only 2 days left to view your monthly stats! Don\'t miss out.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'two_days_before' },
      },
      trigger: {
        date: scheduledDate,
        repeats: false,
      },
    });

    // Save the notification ID
    ids.twoDaysBefore = notificationId;
    await saveNotificationIds(ids);

    console.log('Two days before end notification scheduled for:', scheduledDate.toLocaleString());
    return notificationId;
  } catch (error) {
    console.error('Error scheduling two days before end notification:', error);
    return null;
  }
}

/**
 * Schedule a notification for the last day of the first week
 */
export async function scheduleLastDayNotification() {
  try {
    // Cancel any existing notification
    const ids = await getNotificationIds();
    if (ids.lastDay) {
      await Notifications.cancelScheduledNotificationAsync(ids.lastDay);
    }

    // Schedule for 8:00 PM on the 7th day of next month (last day of the first week)
    const targetDate = getFirstDayOfNextMonth();
    targetDate.setDate(7);
    targetDate.setHours(20, 0, 0, 0);

    // Ensure the date is in the future and handle development mode
    const scheduledDate = createFutureDate(targetDate);
    
    // In development mode, add a small delay to separate test notifications
    if (__DEV__) {
      scheduledDate.setSeconds(scheduledDate.getSeconds() + 10); // Add 10 more seconds
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Final Day for Spotify Crapped',
        body: 'Today is the last day to check your monthly stats! They\'ll be gone tomorrow.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'last_day' },
      },
      trigger: {
        date: scheduledDate,
        repeats: false,
      },
    });

    // Save the notification ID
    ids.lastDay = notificationId;
    await saveNotificationIds(ids);

    console.log('Last day notification scheduled for:', scheduledDate.toLocaleString());
    return notificationId;
  } catch (error) {
    console.error('Error scheduling last day notification:', error);
    return null;
  }
}

/**
 * Send a test notification immediately
 * Only works in development mode
 */
export async function sendTestNotification() {
  if (!__DEV__) {
    console.log('Test notifications only available in development mode');
    return null;
  }
  
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'This is a test notification to verify everything is working correctly!',
        sound: true,
        data: { type: 'test' },
      },
      trigger: null, // null trigger means send immediately
    });
    
    console.log('Test notification sent with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return null;
  }
}

/**
 * Schedule all monthly notifications
 * @param {boolean} testMode - If true, schedules notifications with shorter delays for testing
 * @returns {Promise<boolean>} Whether scheduling was successful
 */
export async function scheduleAllMonthlyNotifications(testMode = false) {
  try {
    // First cancel any existing notifications to avoid duplicates
    await cancelAllNotifications();
    console.log('Cleared any existing notifications before scheduling new ones');
    
    // Request permission first
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) {
      console.log('No notification permission granted');
      await saveNotificationStatus(false);
      return false;
    }

    if (testMode && __DEV__) {
      console.log('Scheduling notifications in test mode with short delays');
      // In test mode, send a test notification first
      await sendTestNotification();
    }

    // Schedule all three notifications
    await scheduleFirstDayNotification();
    await scheduleTwoDaysBeforeEndNotification();
    await scheduleLastDayNotification();
    
    // Save notification status
    await saveNotificationStatus(true);

    return true;
  } catch (error) {
    console.error('Error scheduling all notifications:', error);
    await saveNotificationStatus(false);
    return false;
  }
}

/**
 * Get all pending notification requests
 * @returns {Promise<Array>} Array of pending notifications
 */
export async function getAllScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
} 