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
  disabled?: boolean;
};

export default function GoogleSignInButton({ disabled = false }: Props) {
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

      // APP-007 Tahap 1:
      // Token belum dikirim ke backend dan belum disimpan.
      Alert.alert(
        'Google terhubung',
        'Pemilihan akun Google berhasil. Integrasi dengan backend dilakukan pada Tahap 2.'
      );

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

      Alert.alert(
        'Google Login gagal',
        'Tidak dapat membuka atau menyelesaikan pemilihan akun Google. Periksa konfigurasi aplikasi.'
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

