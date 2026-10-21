
import { loginUser } from '@/services/api';
import { saveSession } from '@/services/session';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function LoginScreen() {
  const { notice } = useLocalSearchParams<{
    notice?: string;
  }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.');
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(
        username.trim(),
        password
      );

      const accessToken =
        data.access ??
        data.data?.access;

      const refreshToken =
        data.refresh ??
        data.data?.refresh;

      if (!accessToken || !refreshToken) {
        throw new Error(
          'Token login tidak ditemukan pada respons backend.'
        );
      }

      await saveSession(
        String(accessToken),
        String(refreshToken)
      );

      router.replace('/home');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Login gagal. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/curhatin-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>
          Tempat aman untuk bercerita dan memahami perasaanmu.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>
          Selamat datang kembali!
        </Text>

        <Text style={styles.description}>
          Masuk untuk melanjutkan perjalanan ceritamu.
        </Text>

        {/* NOTIFIKASI SESI LOGIN BERAKHIR */}
        {typeof notice === 'string' && notice !== '' && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#B95050"
            />

            <Text style={styles.errorText}>
              {notice}
            </Text>
          </View>
        )}

        {/* PESAN ERROR LOGIN */}
        {error !== '' && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#B95050"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        <Text style={styles.label}>
          Username
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#91899D"
          />

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Masukkan username"
            placeholderTextColor="#A6A0B3"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>
          Password
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#91899D"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Masukkan password"
            placeholderTextColor="#A6A0B3"
            secureTextEntry={!showPassword}
            editable={!loading}
            style={styles.input}
          />

          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
            hitSlop={10}
          >
            <Ionicons
              name={
                showPassword
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={21}
              color="#91899D"
            />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text style={styles.primaryButtonText}>
                Memproses...
              </Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>
              Masuk
            </Text>
          )}
        </Pressable>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>
            Belum punya akun?
          </Text>

          <Pressable
            onPress={() => router.push('/register')}
            disabled={loading}
          >
            <Text style={styles.registerLink}>
              {' '}Daftar
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F5FC',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logo: {
    width: 145,
    height: 145,
    marginBottom: -4,
  },

  subtitle: {
    fontSize: 14,
    color: '#756F80',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  title: {
    fontSize: 23,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    color: '#8A8493',
    lineHeight: 20,
    marginBottom: 22,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#F3CACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: '#B95050',
    fontSize: 13,
    lineHeight: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#514A5B',
    marginBottom: 8,
  },

  inputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6DDF1',
    backgroundColor: '#FBF9FD',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#3F384A',
    paddingVertical: 0,
  },

  primaryButton: {
    height: 52,
    backgroundColor: '#8D72C3',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  registerText: {
    fontSize: 14,
    color: '#817A89',
  },

  registerLink: {
    fontSize: 14,
    color: '#8067B7',
    fontWeight: '700',
  },
});
