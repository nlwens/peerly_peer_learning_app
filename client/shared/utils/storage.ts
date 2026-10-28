import AsyncStorage from '@react-native-async-storage/async-storage';

export async function save<T>(key: string, data: T) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function load<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
}
