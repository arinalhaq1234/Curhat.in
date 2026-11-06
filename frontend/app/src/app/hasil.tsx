
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Membersihkan tanda Markdown ** dari respons Gemini
const formatText = (value: string) => {
  return value.replace(/\*\*(.*?)\*\*/gs, '$1');
};

export default function HasilScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const fromHistory = params.from === 'riwayat';
  const ceritaAsli = typeof params.teks === 'string' ? params.teks : '';
  const fromAudio = typeof params.audio_name === 'string' && params.audio_name.trim().length > 0;
  const [showCurhatChoices, setShowCurhatChoices] = useState(false);
  const choosingCurhatRef = useRef(false);

  const startCurhat = (route: '/curhat-text' | '/curhat-audio') => {
    if (choosingCurhatRef.current) return;
    choosingCurhatRef.current = true;
    setShowCurhatChoices(false);
    router.push(route);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fromHistory ? '/riwayat' : '/home');
    }
  };

  const emotion = String(params.emosi ?? '');

  const ringkasanCerita = String(
    params.ringkasan_cerita ?? ''
  );

  const akarMasalah = String(
    params.akar_masalah ?? ''
  );

  const rekomendasi = String(
    params.rekomendasi ?? ''
  );

  const waktu = String(params.waktu ?? '');

  const getEmotionEmoji = (value: string) => {
    const emotionValue = value.toLowerCase();

    if (emotionValue.includes('senang')) return '😄';
    if (emotionValue.includes('bahagia')) return '😊';
    if (emotionValue.includes('sedih')) return '😢';
    if (emotionValue.includes('cemas')) return '😟';
    if (emotionValue.includes('khawatir')) return '😟';
    if (emotionValue.includes('marah')) return '😠';
    if (emotionValue.includes('kesal')) return '😤';
    if (emotionValue.includes('tertekan')) return '😣';
    if (emotionValue.includes('stres')) return '😫';
    if (emotionValue.includes('takut')) return '😨';
    if (emotionValue.includes('kecewa')) return '😞';
    if (emotionValue.includes('bingung')) return '😕';
    if (emotionValue.includes('lelah')) return '😮‍💨';
    if (emotionValue.includes('tenang')) return '😌';
    if (emotionValue.includes('malu')) return '😳';
    if (emotionValue.includes('kesepian')) return '😔';
    if (emotionValue.includes('semangat')) return '🤩';
    if (emotionValue.includes('terkejut')) return '😮';
    if (emotionValue.includes('bosan')) return '🥱';

    return '😐';
  };

  return (
    <>
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: styles.container.paddingBottom + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#8067B7"
          />
        </Pressable>

        <View style={styles.headerTitleWrapper}>
          <Text style={styles.title}>
            Hasil Analisis
          </Text>
        </View>
      </View>

      {/* EMOSI UTAMA */}
      <View style={styles.emotionCard}>
        <View style={styles.emotionHeader}>
          <Text style={styles.emotionLabel}>
            Emosi Utama
          </Text>

          {waktu ? (
            <Text
              style={styles.emotionTime}
              numberOfLines={1}
            >
              {waktu}
            </Text>
          ) : null}
        </View>

        <View style={styles.emotionContent}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emotionEmoji}>
              {getEmotionEmoji(emotion)}
            </Text>
          </View>

          <View style={styles.emotionTextWrapper}>
            <Text style={styles.emotionTitle}>
              {emotion || 'Tidak diketahui'}
            </Text>

            <Text style={styles.summaryText}>
              Hasil analisis emosi berdasarkan cerita
              yang kamu sampaikan.
            </Text>
          </View>
        </View>
      </View>

      {fromHistory && (
        <View style={styles.card}>
          <View style={styles.cardIconBlue}>
            <Ionicons
              name="document-text-outline"
              size={21}
              color="#6675CD"
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Cerita Kamu</Text>
            <Text style={styles.cardText}>
              {ceritaAsli.trim() ? ceritaAsli : fromAudio
                ? 'Cerita ini dikirim melalui rekaman suara.'
                : 'Isi cerita belum tersedia.'}
            </Text>
          </View>
        </View>
      )}

      {/* RINGKASAN CERITA */}
      <View style={styles.card}>
        <View style={styles.cardIconBlue}>
          <Ionicons
            name="document-text-outline"
            size={21}
            color="#6675CD"
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            Ringkasan Cerita
          </Text>

          <Text style={styles.cardText}>
            {ringkasanCerita ||
              'Ringkasan cerita belum tersedia.'}
          </Text>
        </View>
      </View>

      {/* AKAR MASALAH */}
      <View style={styles.card}>
        <View style={styles.cardIconPurple}>
          <Ionicons
            name="search-outline"
            size={22}
            color="#8D72C3"
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            Akar Masalah
          </Text>

          <Text style={styles.cardText}>
            {akarMasalah ||
              'Akar masalah belum tersedia.'}
          </Text>
        </View>
      </View>

      {/* REKOMENDASI */}
      <View style={styles.recommendationCard}>
        <View style={styles.recommendationHeader}>
          <View style={styles.cardIconYellow}>
            <Ionicons
              name="bulb-outline"
              size={22}
              color="#D79A3A"
            />
          </View>

          <Text style={styles.recommendationTitle}>
            Rekomendasi
          </Text>
        </View>

        <Text style={styles.recommendationText}>
          {formatText(rekomendasi) ||
            'Rekomendasi belum tersedia.'}
        </Text>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={20} color="#8D72C3" />
        <Text style={styles.disclaimerText}>
          Hasil analisis ini merupakan dukungan awal untuk memahami perasaanmu, bukan diagnosis klinis atau pengganti bantuan profesional.
        </Text>
      </View>

      {/* BUTTON */}
      <View style={styles.buttonRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.replace('/home')
          }
        >
          <Text style={styles.secondaryButtonText}>
            Kembali ke Home
          </Text>
        </Pressable>

        {!fromHistory && (
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push('/riwayat')
            }
          >
            <Text style={styles.primaryButtonText}>
              Lihat Riwayat
            </Text>
          </Pressable>
        )}
      </View>
      <Pressable
        style={styles.curhatAgainButton}
        onPress={() => {
          choosingCurhatRef.current = false;
          setShowCurhatChoices(true);
        }}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryButtonText}>
          {fromHistory ? 'Mulai Cerita Baru' : 'Buat Curhatan Lain'}
        </Text>
      </Pressable>
    </ScrollView>
    <Modal
      visible={showCurhatChoices}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setShowCurhatChoices(false)}
    >
      <View style={styles.choiceOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowCurhatChoices(false)}
          accessibilityLabel="Tutup pilihan curhat"
          accessibilityRole="button"
        />
        <View style={styles.choiceCard} accessibilityViewIsModal>
          <Text style={styles.choiceTitle} accessibilityRole="header">Pilih Cara Bercerita</Text>
          <Text style={styles.choiceDescription}>Pilih cara yang paling nyaman untuk bercerita.</Text>
          <Pressable
            style={styles.choiceOption}
            onPress={() => startCurhat('/curhat-text')}
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={24} color="#8067B7" />
            <Text style={styles.choiceOptionText}>Curhat Teks</Text>
            <Ionicons name="chevron-forward" size={18} color="#A28DBB" />
          </Pressable>
          <Pressable
            style={styles.choiceOption}
            onPress={() => startCurhat('/curhat-audio')}
            accessibilityRole="button"
          >
            <Ionicons name="mic-outline" size={24} color="#8067B7" />
            <Text style={styles.choiceOptionText}>Curhat Suara</Text>
            <Ionicons name="chevron-forward" size={18} color="#A28DBB" />
          </Pressable>
          <Pressable
            style={styles.choiceCancel}
            onPress={() => setShowCurhatChoices(false)}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Batal</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F5FC',
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    elevation: 2,
  },

  headerTitleWrapper: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 3,
  },

  subtitle: {
    fontSize: 13,
    color: '#8A8493',
    lineHeight: 18,
  },

  emotionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },

  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },

  emotionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4352',
  },

  emotionTime: {
    fontSize: 10,
    color: '#AAA2B2',
    flexShrink: 1,
    textAlign: 'right',
  },

  emotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emojiCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF0CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  emotionEmoji: {
    fontSize: 36,
  },

  emotionTextWrapper: {
    flex: 1,
  },

  emotionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 5,
  },

  summaryText: {
    fontSize: 13,
    color: '#817A89',
    lineHeight: 19,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },

  cardIconBlue: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E9EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  cardIconPurple: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEE6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 6,
  },

  cardText: {
    fontSize: 13,
    color: '#817A89',
    lineHeight: 20,
  },

  timeText: {
    fontSize: 11,
    color: '#AAA2B2',
    marginTop: 10,
  },

  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },

  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  cardIconYellow: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF1D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  recommendationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A4352',
  },

  recommendationText: {
    fontSize: 13,
    color: '#6F6878',
    lineHeight: 20,
  },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#EEE7F7',
    marginBottom: 20,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#766987',
    lineHeight: 19,
  },

  curhatAgainButton: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8CDE7',
    backgroundColor: '#EEE5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  choiceOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(63, 56, 74, 0.35)',
  },

  choiceCard: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FCFAFE',
  },

  choiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#55416F',
    textAlign: 'center',
    marginBottom: 8,
  },

  choiceDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#817A89',
    textAlign: 'center',
    marginBottom: 22,
  },

  choiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EEE5FA',
    marginBottom: 12,
  },

  choiceOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#8067B7',
  },

  choiceCancel: {
    minHeight: 44,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },

  primaryButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#8D72C3',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8CDE7',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  secondaryButtonText: {
    color: '#8067B7',
    fontSize: 14,
    fontWeight: '700',
  },
});
