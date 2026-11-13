import * as SecureStore from 'expo-secure-store';
import { clearReadCache } from './readCache';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export async function saveSession(
  accessToken: string,
  refreshToken: string
) {
  clearReadCache();
  await SecureStore.setItemAsync(
    ACCESS_TOKEN_KEY,
    accessToken
  );

  await SecureStore.setItemAsync(
    REFRESH_TOKEN_KEY,
    refreshToken
  );
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearSession() {
  clearReadCache();
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
