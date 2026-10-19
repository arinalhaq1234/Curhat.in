import { getProfile } from '@/services/api';
import {
  clearSession,
  getAccessToken,
} from '@/services/session';

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function Index() {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  const startApp = async () => {
    setChecking(true);
    setError('');

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        router.replace('/login');
        return;
      }

      // Memeriksa apakah token masih berlaku.
      await getProfile(accessToken);

      router.replace('/home');
    } catch (err: any) {
      console.log('Gagal memeriksa sesi awal:', err);

      if (err?.status === 401) {
        await clearSession();
        router.replace('/login');
        return;
      }

      setError(
        'Tidak dapat memeriksa sesi. Pastikan backend dan koneksi tersedia.'
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startApp();
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/curhatin-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>
          Tempat aman untuk bercerita dan didengarkan
        </Text>

        {checking ? (
          <ActivityIndicator
            size="small"
            color="#8D72C3"
            style={styles.loader}
          />
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={startApp}
              disabled={checking}
            >
              <Text style={styles.retryText}>
                Coba Lagi
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.decorationLeft} />
      <View style={styles.decorationRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFAFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    overflow: 'hidden',
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  logo: {
    width: 190,
    height: 190,
    marginBottom: -8,
  },

  subtitle: {
    fontSize: 15,
    color: '#756F80',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },

  loader: {
    marginTop: 24,
  },

  errorContainer: {
    alignItems: 'center',
    marginTop: 22,
  },

  errorText: {
    fontSize: 13,
    color: '#D95C5C',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
  },

  retryButton: {
    backgroundColor: '#8D72C3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  decorationLeft: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#EEE4FA',
    bottom: -130,
    left: -100,
  },

  decorationRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FCE5EF',
    bottom: -130,
    right: -100,
  },
});