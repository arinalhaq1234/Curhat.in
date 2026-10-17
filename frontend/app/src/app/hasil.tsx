import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HasilScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>Hasil Analisis</Text>
          <Text style={styles.subtitle}>
            Ini adalah gambaran dari cerita yang kamu bagikan.
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Emosi utama</Text>
        <Text style={styles.summaryValue}>Sedih</Text>
        <Text style={styles.summaryText}>
          Kamu tampaknya sedang mengalami perasaan sedih dan cukup terbebani.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Ringkasan</Text>

      <View style={styles.card}>
        <Text style={styles.cardIcon}>📝</Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Cerita kamu</Text>
          <Text style={styles.cardText}>
            Ringkasan dari curhat yang kamu sampaikan akan tampil pada bagian ini.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Respons untukmu</Text>

      <View style={styles.card}>
        <Text style={styles.cardIcon}>💜</Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Pesan empatik</Text>
          <Text style={styles.cardText}>
            Wajar jika kamu merasa lelah. Kamu sudah melakukan hal yang baik
            dengan menceritakan apa yang sedang kamu rasakan.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Rekomendasi</Text>

      <View style={styles.recommendationCard}>
        <View style={styles.recommendationItem}>
          <Text style={styles.number}>1</Text>
          <Text style={styles.recommendationText}>
            Beri dirimu waktu untuk beristirahat sejenak.
          </Text>
        </View>

        <View style={styles.recommendationItem}>
          <Text style={styles.number}>2</Text>
          <Text style={styles.recommendationText}>
            Ceritakan perasaanmu kepada orang yang kamu percaya.
          </Text>
        </View>

        <View style={styles.recommendationItem}>
          <Text style={styles.number}>3</Text>
          <Text style={styles.recommendationText}>
            Lakukan aktivitas sederhana yang membuatmu merasa lebih tenang.
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.replace('/home')}
      >
        <Text style={styles.primaryButtonText}>
          Kembali ke Home
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push('/riwayat')}
      >
        <Text style={styles.secondaryButtonText}>
          Lihat Riwayat
        </Text>
      </Pressable>
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

  summaryCard: {
    backgroundColor: '#EDE5F7',
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#7F718F',
    marginBottom: 6,
  },

  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#5A466F',
    marginBottom: 8,
  },

  summaryText: {
    fontSize: 14,
    color: '#756A81',
    lineHeight: 21,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  cardIcon: {
    fontSize: 24,
    marginRight: 14,
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
    fontSize: 14,
    color: '#817A89',
    lineHeight: 21,
  },

  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },

  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE5F7',
    color: '#8067B7',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '700',
    marginRight: 12,
  },

  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#6F6878',
    lineHeight: 20,
  },

  primaryButton: {
    height: 54,
    backgroundColor: '#8D72C3',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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