
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { sendTextCurhat } from '@/services/api';
import {
  clearSession,
  getAccessToken,
} from '@/services/session';

const MIN_LENGTH = 150;
const MAX_LENGTH = 5000;

export default function CurhatTextScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submittingRef = useRef(false);

  const handleSubmit = async () => {
    if (submittingRef.current) {
      return;
    }

    setError('');

    const trimmedText = text.trim();

    // VALIDASI CERITA KOSONG
    if (!trimmedText) {
      setError('Cerita tidak boleh kosong.');
      return;
    }

    // VALIDASI MINIMAL 150 KARAKTER
    if (trimmedText.length < MIN_LENGTH) {
      setError(
        `Cerita minimal ${MIN_LENGTH} karakter. Silakan lengkapi ceritamu.`
      );
      return;
    }

    // VALIDASI MAKSIMAL 5000 KARAKTER
    if (trimmedText.length > MAX_LENGTH) {
      setError(
        `Cerita maksimal ${MAX_LENGTH} karakter. Silakan persingkat ceritamu.`
      );
      return;
    }

    submittingRef.current = true;

    try {
      setLoading(true);

      const accessToken = await getAccessToken();

      // SESI LOGIN TIDAK TERSEDIA
      if (!accessToken) {
        await clearSession();
        router.replace('/login');
        return;
      }

      // KIRIM CERITA KE BACKEND
      // Tanpa timeout 3 menit
      const response = await sendTextCurhat(
        trimmedText,
        accessToken
      );

      console.log(
        'CURHAT TEXT RESPONSE:',
        response
      );

      const result = response.data ?? response;

      // NAVIGASI KE HALAMAN HASIL ANALISIS
      router.push({
        pathname: '/hasil',
        params: {
          teks: String(result.teks ?? ''),
          emosi: String(result.emosi ?? ''),
          ringkasan_cerita: String(
            result.ringkasan_cerita ?? ''
          ),
          akar_masalah: String(
            result.akar_masalah ?? ''
          ),
          rekomendasi: String(
            result.rekomendasi ?? ''
          ),
          waktu: String(result.waktu ?? ''),
        },
      });
    } catch (error: any) {
      console.log(
        'CURHAT TEXT ERROR:',
        error
      );

      // SESI LOGIN BERAKHIR
      if (error?.status === 401) {
        await clearSession();

        router.replace({
          pathname: '/login',
          params: {
            notice: 'Sesi kamu telah berakhir. Silakan masuk kembali.',
          },
        });

        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : '';

      const isConnectionError =
        /fetch failed|network request failed|failed to fetch|network error|unexpected end of stream/i.test(
          message
        );

      if (isConnectionError) {
        setError(
          'Gagal terhubung ke server. Periksa koneksi dan coba lagi.'
        );
      } else if (error?.status === 429) {
        setError(
          'Layanan analisis sedang menerima terlalu banyak permintaan. Silakan coba lagi beberapa saat.'
        );
      } else if (error?.status === 500) {
        setError(
          'Ada kendala saat memproses ceritamu. Silakan coba lagi nanti.'
        );
      } else if (
        error?.status === 502 ||
        error?.status === 503 ||
        error?.status === 504
      ) {
        setError(
          'Layanan analisis sedang mengalami gangguan. Silakan coba lagi nanti.'
        );
      } else {
        setError(
          message ||
            'Gagal mengirim cerita. Silakan coba lagi.'
        );
      }

      // Teks curhatan tetap tersimpan
      // agar pengguna tidak perlu mengetik ulang.
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>
            Curhat lewat teks
          </Text>

          <Text style={styles.subtitle}>
            Ceritakan apa pun yang sedang kamu rasakan.
          </Text>
        </View>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>
          Ruang ini untukmu
        </Text>

        <Text style={styles.messageText}>
          Tulis dengan nyaman. Tidak perlu menyusun kata-kata dengan sempurna.
        </Text>
      </View>

      <Text style={styles.label}>
        Ceritamu
      </Text>

      <TextInput
        value={text}
        onChangeText={(value) => {
          setText(value);

          if (error) {
            setError('');
          }
        }}
        placeholder="Ceritakan apa yang sedang terjadi dan bagaimana perasaanmu..."
        placeholderTextColor="#A6A0B3"
        multiline
        textAlignVertical="top"
        style={[
          styles.textArea,
          error
            ? styles.textAreaError
            : null,
        ]}
        editable={!loading}
        maxLength={MAX_LENGTH}
      />

      <View style={styles.inputInfo}>
        <View style={styles.errorContainer}>
          {error ? (
            <Text style={styles.errorText}>
              {error}
            </Text>
          ) : null}
        </View>

        <Text style={styles.characterCount}>
          {text.length}/{MAX_LENGTH}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>
          💜
        </Text>

        <Text style={styles.infoText}>
          Ceritamu akan diproses untuk membantu memahami emosi dan memberikan
          respons yang sesuai.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color="#8D72C3"
          />

          <Text style={styles.loadingTitle}>
            Sedang menganalisis ceritamu...
          </Text>

          <Text style={styles.loadingText}>
            Tunggu sebentar, ya.
          </Text>
        </View>
      ) : (
        <>
          <Pressable
            style={[
              styles.primaryButton,
              !text.trim() &&
                styles.primaryButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              Kirim Curhat
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>
              Batal
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F5FC',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  backText: {
    fontSize: 30,
    color: '#8067B7',
    marginTop: -2,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: '#8A8493',
    lineHeight: 20,
    maxWidth: 270,
  },

  messageCard: {
    backgroundColor: '#EDE5F7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },

  messageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#514267',
    marginBottom: 6,
  },

  messageText: {
    fontSize: 14,
    color: '#756A81',
    lineHeight: 21,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#514A5B',
    marginBottom: 8,
  },

  textArea: {
    minHeight: 220,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DDEF',
    borderRadius: 20,
    padding: 18,
    fontSize: 15,
    color: '#3F384A',
    lineHeight: 22,
  },

  textAreaError: {
    borderColor: '#D95C5C',
  },

  inputInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
  },

  errorContainer: {
    flex: 1,
    paddingRight: 12,
  },

  errorText: {
    fontSize: 12,
    color: '#D95C5C',
    lineHeight: 17,
  },

  characterCount: {
    fontSize: 12,
    color: '#938B9D',
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FBF9FD',
    borderRadius: 16,
    padding: 14,
    marginBottom: 28,
  },

  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#817A89',
    lineHeight: 18,
  },

  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },

  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4352',
    marginTop: 14,
    marginBottom: 6,
  },

  loadingText: {
    fontSize: 13,
    color: '#8A8493',
  },

  primaryButton: {
    height: 54,
    backgroundColor: '#8D72C3',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  primaryButtonDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    height: 52,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#D8CDE7',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  secondaryButtonText: {
    color: '#8067B7',
    fontSize: 15,
    fontWeight: '700',
  },
});
