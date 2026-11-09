import { ApiError, loginWithGoogle, registerWithGoogle } from '@/services/api';
import { saveSession } from '@/services/session';
import { router } from 'expo-router';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  mode: 'login' | 'register';
  disabled?: boolean;
};

export default function GoogleSignInButton({
  mode,
  disabled = false,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading || disabled) return;

    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    if (!clientId) {
      Alert.alert(
        'Konfigurasi belum lengkap',
        'Google Web Client ID belum dikonfigurasi pada aplikasi.'
      );
      return;
    }

    setLoading(true);

    try {
      GoogleSignin.configure({
        webClientId: clientId,
      });

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        Alert.alert(
          'Dibatalkan',
          'Pemilihan akun Google dibatalkan.'
        );
        return;
      }

      if (!response.data.idToken) {
        Alert.alert(
          'Login Google',
          'Google ID Token tidak tersedia. Periksa konfigurasi OAuth.'
        );
        return;
      }
      // APP-007 Tahap 2: Verifikasi Google ID Token melalui Django.
      const result = mode === 'register'
        ? await registerWithGoogle(response.data.idToken)
        : await loginWithGoogle(response.data.idToken);

      if (result?.success !== true) {
        throw new Error(
          typeof result?.message === 'string'
            ? result.message
            : 'Login Google gagal.'
        );
      }

      const accessToken = result?.data?.access;
      const refreshToken = result?.data?.refresh;

      if (
        typeof accessToken !== 'string' ||
        !accessToken ||
        typeof refreshToken !== 'string' ||
        !refreshToken
      ) {
        throw new Error('Token sesi Curhat.in tidak tersedia.');
      }

      if (mode === 'register') {
        Alert.alert(
          'Pendaftaran berhasil',
          'Akun Google berhasil didaftarkan. Silakan masuk menggunakan Google.',
          [
            {
              text: 'Ke Login',
              onPress: () => router.replace('/login'),
            },
          ]
        );
        return;
      }

      await saveSession(accessToken, refreshToken);
      router.replace('/home');
} catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.IN_PROGRESS) {
          return;
        }

        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert(
            'Layanan Google tidak tersedia',
            'Periksa Google Play Services pada perangkat.'
          );
          return;
        }
      }

      if (error instanceof ApiError) {
        Alert.alert(
          mode === 'register' ? 'Daftar Google gagal' : 'Login Google gagal',
          error.message
        );
        return;
      }

      Alert.alert(
        mode === 'register' ? 'Daftar Google gagal' : 'Login Google gagal',
        error instanceof Error
          ? error.message
          : 'Tidak dapat menyelesaikan autentikasi Google. Silakan coba kembali.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.separator}>atau</Text>

      <Pressable
        style={[
          styles.button,
          (loading || disabled) && styles.disabled,
        ]}
        onPress={handleGoogleSignIn}
        disabled={loading || disabled}
        accessibilityRole="button"
        accessibilityLabel="Lanjutkan dengan Google"
      >
        {loading ? (
          <ActivityIndicator color="#8067B7" />
        ) : (
          <Image source={require("../assets/google-logo.png")} style={styles.googleLogo} resizeMode="contain" />
        )}

        <Text style={styles.buttonText}>
          {loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },
  separator: {
    textAlign: 'center',
    color: '#817A89',
    fontSize: 13,
    marginBottom: 14,
  },
  button: {
    height: 52,
    borderWidth: 1,
    borderColor: '#747775',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleLogo: {
    width: 22,
    height: 22,
  },
  buttonText: {
    color: '#1F1F1F',
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
