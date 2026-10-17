import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HasilScreen() {
  // Sementara masih dummy.
  // Nanti nilai ini bisa langsung diganti dari hasil API backend.
  const emotion = 'Sedih';

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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
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

          <Text style={styles.subtitle}>
            Gambaran dari cerita yang kamu bagikan.
          </Text>
        </View>
      </View>

      {/* EMOSI UTAMA */}
      <View style={styles.emotionCard}>
        <View style={styles.emotionHeader}>
          <Text style={styles.emotionLabel}>
            Emosi Utama
          </Text>

        </View>

        <View style={styles.emotionContent}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emotionEmoji}>
              {getEmotionEmoji(emotion)}
            </Text>
          </View>

          <View style={styles.emotionTextWrapper}>
            <Text style={styles.emotionTitle}>
              {emotion}
            </Text>

            <Text style={styles.summaryText}>
              Kamu tampaknya sedang mengalami perasaan sedih dan cukup
              terbebani.
            </Text>
          </View>
        </View>
      </View>

      {/* RINGKASAN */}
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
            Ringkasan dari curhat yang kamu sampaikan akan tampil pada
            bagian ini.
          </Text>
        </View>
      </View>

      {/* RESPONS EMPATIK */}
      <View style={styles.card}>
        <View style={styles.cardIconPurple}>
          <Ionicons
            name="heart-outline"
            size={22}
            color="#8D72C3"
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            Respons Empatik
          </Text>

          <Text style={styles.cardText}>
            Wajar jika kamu merasa lelah. Kamu sudah melakukan hal yang
            baik dengan menceritakan apa yang sedang kamu rasakan.
            Kamu tidak harus menghadapi semuanya sendiri.
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

        <View style={styles.recommendationItem}>
          <View style={styles.numberCircle}>
            <Text style={styles.number}>1</Text>
          </View>

          <Text style={styles.recommendationText}>
            Beri dirimu waktu untuk beristirahat sejenak.
          </Text>
        </View>

        <View style={styles.recommendationItem}>
          <View style={styles.numberCircle}>
            <Text style={styles.number}>2</Text>
          </View>

          <Text style={styles.recommendationText}>
            Ceritakan perasaanmu kepada orang yang kamu percaya.
          </Text>
        </View>

        <View style={styles.recommendationItem}>
          <View style={styles.numberCircle}>
            <Text style={styles.number}>3</Text>
          </View>

          <Text style={styles.recommendationText}>
            Lakukan aktivitas sederhana yang membuatmu merasa lebih tenang.
          </Text>
        </View>
      </View>

      {/* BUTTON */}
      <View style={styles.buttonRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.secondaryButtonText}>
            Kembali ke Home
          </Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/riwayat')}
        >
          <Text style={styles.primaryButtonText}>
            Lihat Riwayat
          </Text>
        </Pressable>
      </View>
    </ScrollView>
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
  },

  emotionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4352',
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
    marginBottom: 16,
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

  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  numberCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#EEE6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  number: {
    color: '#8067B7',
    fontWeight: '700',
    fontSize: 12,
  },

  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: '#6F6878',
    lineHeight: 19,
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