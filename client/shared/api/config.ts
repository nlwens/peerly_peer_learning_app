import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

const HOST = __DEV__ ? getHost() : 'localhost';

//export const API_BASE_URL = `http://${HOST}:3000`;
export const API_BASE_URL = 'https://peerly-app.saxion.online'

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
