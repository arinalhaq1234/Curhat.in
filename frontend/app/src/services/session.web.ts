import { clearReadCache } from './readCache';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function getStorage(): Storage | null {
  // Static rendering tidak memiliki window atau penyimpanan browser.
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export async function saveSession(accessToken: string, refreshToken: string) {
  const storage = getStorage();
  if (!storage) {
    throw new Error('Penyimpanan sesi browser belum tersedia.');
  }

  clearReadCache();
  try {
    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    // Jangan meninggalkan pasangan token yang hanya tersimpan sebagian.
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    throw error;
  }
}

export async function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export async function getRefreshToken() {
  return getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export async function clearSession() {
  clearReadCache();
  const storage = getStorage();
  storage?.removeItem(ACCESS_TOKEN_KEY);
  storage?.removeItem(REFRESH_TOKEN_KEY);
}
