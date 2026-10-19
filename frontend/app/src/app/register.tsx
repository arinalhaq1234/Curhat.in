
import { registerUser } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    return /^\S+@\S+\.\S+$/.test(value);
  };

  const handleRegister = async () => {
    if (loading) return;

    setError('');

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError('Semua field wajib diisi.');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username minimal 3 karakter.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Format email tidak valid.');
      return;
    }

    const isPasswordValid =
      password.length >= 8 &&
      password.length <= 20 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!isPasswordValid) {
      setError(
        'Password harus terdiri dari 8–20 karakter dan mengandung huruf besar, huruf kecil, angka, serta karakter khusus.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sesuai dengan password.');
      return;
    }

    try {
      setLoading(true);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 150);
      });

      await registerUser(
        username.trim(),
        email.trim(),
        password
      );

      router.replace('/login');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Registrasi gagal. Silakan coba lagi.'
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
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/curhatin-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>
          Buat akun untuk mulai berbagi cerita dengan nyaman.
        </Text>
      </View>

      {/* CARD REGISTER */}
      <View style={styles.card}>
        <Text style={styles.title}>
          Buat Akun Baru
        </Text>

        <Text style={styles.description}>
          Isi data berikut untuk mendaftar ke Curhat.in.
        </Text>

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

        {/* USERNAME */}
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
            editable={!loading}
            style={styles.input}
          />
        </View>

        {/* EMAIL */}
        <Text style={styles.label}>
          Email
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#91899D"
          />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Masukkan email"
            placeholderTextColor="#A6A0B3"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            style={styles.input}
          />
        </View>

        {/* PASSWORD */}
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
            maxLength={20}
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

        {/* KETENTUAN PASSWORD */}
        <Text style={styles.passwordHint}>
          Password 8–20 karakter, mengandung huruf besar,
          huruf kecil, angka, dan karakter khusus.
        </Text>

        {/* KONFIRMASI PASSWORD */}
        <Text style={styles.label}>
          Konfirmasi Password
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#91899D"
          />

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Masukkan ulang password"
            placeholderTextColor="#A6A0B3"
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
            maxLength={20}
            style={styles.input}
          />

          <Pressable
            onPress={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            disabled={loading}
            hitSlop={10}
          >
            <Ionicons
              name={
                showConfirmPassword
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={21}
              color="#91899D"
            />
          </Pressable>
        </View>

        {/* BUTTON REGISTER */}
        <Pressable
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text style={styles.primaryButtonText}>
                Mendaftarkan...
              </Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>
              Daftar
            </Text>
          )}
        </Pressable>

        {/* LINK LOGIN */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>
            Sudah punya akun?
          </Text>

          <Pressable
            onPress={() => router.replace('/login')}
            disabled={loading}
          >
            <Text style={styles.loginLink}>
              {' '}Masuk
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
    paddingTop: 42,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 22,
  },

  logo: {
    width: 140,
    height: 140,
    marginBottom: -4,
  },

  subtitle: {
    fontSize: 14,
    color: '#756F80',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    color: '#8A8493',
    lineHeight: 20,
    marginBottom: 20,
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

  passwordHint: {
    fontSize: 12,
    color: '#8A8493',
    lineHeight: 18,
    marginTop: -8,
    marginBottom: 12,
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

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  loginText: {
    fontSize: 14,
    color: '#817A89',
  },

  loginLink: {
    fontSize: 14,
    color: '#8067B7',
    fontWeight: '700',
  },
});
