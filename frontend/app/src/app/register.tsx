import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Curhat.in</Text>
        <Text style={styles.subtitle}>
          Buat akun untuk mulai berbagi cerita dengan nyaman.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Buat Akun</Text>
        <Text style={styles.description}>
          Isi data berikut untuk mendaftar ke Curhat.in.
        </Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          placeholder="Masukkan username"
          placeholderTextColor="#A6A0B3"
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Masukkan email"
          placeholderTextColor="#A6A0B3"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Minimal 8 karakter"
          placeholderTextColor="#A6A0B3"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.primaryButtonText}>Daftar</Text>
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Sudah punya akun?</Text>

          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.loginLink}> Masuk</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5FC',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logo: {
    fontSize: 34,
    fontWeight: '700',
    color: '#8067B7',
    marginBottom: 8,
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
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#514A5B',
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E6DDF1',
    backgroundColor: '#FBF9FD',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#3F384A',
    marginBottom: 18,
  },

  primaryButton: {
    height: 52,
    backgroundColor: '#8D72C3',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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