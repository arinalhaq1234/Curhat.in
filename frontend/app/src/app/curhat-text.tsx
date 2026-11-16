import { draftOwner, readDraft, writeDraft, removeDraft, prepareAnalysis } from '@/services/drafts';
import AnalysisWaiting from '@/components/analysis-waiting';
import { Ionicons } from '@expo/vector-icons';

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { formatCurhatFailure, sendTextCurhat } from '@/services/api';
import {
  clearSession,
  getAccessToken,
} from '@/services/session';

const MIN_LENGTH = 150;
const MAX_LENGTH = 5000;

export default function CurhatTextScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingLong, setWaitingLong] = useState(false);
  useEffect(() => {
    setWaitingLong(false);
    if (!loading) return;
    const timer = setTimeout(() => setWaitingLong(true), 2 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [loading]);
  const [error, setError] = useState('');

  const ownerRef = useRef<string | null>(null);
   const [draftReady, setDraftReady] = useState(false);
   const [retryAnalysis, setRetryAnalysis] = useState(false);
   useFocusEffect(useCallback(() => {
     let active = true;
     setDraftReady(false);
     void draftOwner().then(owner => {
       if (!active) return;
       ownerRef.current = owner;
       const draft = readDraft(owner, 'text');
       setText(draft?.text ?? '');
       setRetryAnalysis(!!draft?.baseline);
       setDraftReady(true);
     }).catch(() => { if (active) setError('Cerita belum dapat dimuat. Silakan masuk kembali.'); });
     return () => { active = false; ownerRef.current = null; setDraftReady(false); setText(''); };
   }, []));

   const submittingRef = useRef(false);

  const handleSubmit = async () => {
    if (submittingRef.current || !draftReady || !ownerRef.current) {
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

      const owner = ownerRef.current!;
      const previous = readDraft(owner, 'text');
      writeDraft(owner, { kind: 'text', text, baseline: previous?.text?.trim() === trimmedText ? previous.baseline : undefined });
      const accessToken = await getAccessToken();

      // SESI LOGIN TIDAK TERSEDIA
      if (!accessToken) {
        await clearSession();
        router.replace({ pathname: '/login', params: { notice: 'Silakan masuk kembali. Ceritamu tetap tersimpan di perangkat ini.' } });
        return;
      }

      if (await draftOwner() !== owner) throw new Error('Akun telah berubah. Buka kembali cerita dari Home.');
      // KIRIM CERITA KE BACKEND
      // Tanpa timeout 3 menit
      const recovered = await prepareAnalysis(owner, 'text', accessToken);
      setRetryAnalysis(true);
      const response = recovered ? { data: recovered } : await sendTextCurhat(
        trimmedText,
        accessToken
      );



      const result = response?.data ?? response;

      // Hanya buka hasil jika seluruh field analisis berisi teks yang valid.
      if (
        response?.success === false ||
        !result ||
        typeof result !== 'object' ||
        Array.isArray(result) ||
        !['emosi', 'ringkasan_cerita', 'akar_masalah', 'rekomendasi', 'waktu'].every(
          (field) => typeof result[field] === 'string' && result[field].trim().length > 0
        )
      ) {
        setError(
          'Hasil analisis belum tersedia atau belum lengkap. Ceritamu tetap tersimpan di perangkat ini. Silakan coba lagi.'
        );
        return;
      }

      if (ownerRef.current !== owner || await draftOwner() !== owner ||
          readDraft(owner, 'text')?.text !== text) return;
      removeDraft(owner, 'text');
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
      setRetryAnalysis(true);

      // SESI LOGIN BERAKHIR
      if (error?.status === 401) {
        await clearSession();

        router.replace({
          pathname: '/login',
          params: {
            notice: 'Sesi kamu telah berakhir. Ceritamu tetap tersimpan. Silakan masuk kembali.',
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
          formatCurhatFailure(message, error?.status, false)
        );
      } else if (error?.status === 429) {
        setError(
          formatCurhatFailure(message, error.status, false)
        );
      } else if (error?.status === 500) {
        setError(
          formatCurhatFailure(message, error.status, false)
        );
      } else if (
        error?.status === 502 ||
        error?.status === 503 ||
        error?.status === 504
      ) {
        setError(
          formatCurhatFailure(message, error.status, false)
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(56, insets.top + 16),
          paddingBottom: styles.container.paddingBottom + insets.bottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={25} color="#3F384A" />
        </Pressable>
        <Text style={styles.title}>Curhat Teks</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>Ruang ini untukmu 💜</Text>
        <Text style={styles.messageText}>
          Ceritakan apa yang kamu alami dan rasakan dengan bahasa yang nyaman. Boleh gunakan emoji juga 😊 Tulis minimal 150 dan maksimal 5000 karakter, ya.
        </Text>
      </View>

      <View style={styles.inputHeading}>
        <Text style={styles.label}>Tuliskan di sini ceritamu 🤗</Text>
      </View>

      <TextInput
        value={text}
        onChangeText={(value) => {
          if (!ownerRef.current) return;
           try {
             const previous = readDraft(ownerRef.current, 'text');
             writeDraft(ownerRef.current, { kind: 'text', text: value, baseline: previous?.text?.trim() === value.trim() ? previous.baseline : undefined });
             setText(value);
           } catch {
             setText(value);
             setError('Draft belum dapat disimpan. Jangan tutup halaman ini; periksa ruang penyimpanan.');
           }

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
        editable={!loading && draftReady}
        maxLength={MAX_LENGTH}
      />

      <Text style={styles.characterCount}>
        {text.length}/{MAX_LENGTH}
      </Text>

      {error ? (
        <View style={styles.errorContainer} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={17} color="#B45363" style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

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
          {waitingLong ? <AnalysisWaiting /> : <>
          <ActivityIndicator
            size="large"
            color="#8D72C3"
          />

          <Text style={styles.loadingTitle}>
            Sedang menganalisis ceritamu...
          </Text>
          </>}
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
              {retryAnalysis ? 'Coba Analisis Lagi' : 'Kirim Curhat'}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F5FC',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F5FC',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginBottom: 18,
  },

  headerSpacer: {
    width: 44,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#352F3F',
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
    flexShrink: 1,
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

  inputHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    gap: 8,
  },

  errorIcon: {
    marginTop: 1,
  },

  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#B45363',
    lineHeight: 18,
  },

  characterCount: {
    fontSize: 12,
    color: '#938B9D',
    textAlign: 'right',
    marginTop: 8,
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FBF9FD',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    marginBottom: 24,
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
