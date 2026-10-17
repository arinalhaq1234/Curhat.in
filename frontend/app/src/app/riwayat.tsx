import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function RiwayatScreen() {
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
          <Text style={styles.title}>Riwayat Curhat</Text>
          <Text style={styles.subtitle}>
            Lihat kembali cerita yang pernah kamu bagikan.
          </Text>
        </View>
      </View>

      <View style={styles.emptyCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🕘</Text>
        </View>

        <Text style={styles.emptyTitle}>
          Belum ada riwayat
        </Text>

        <Text style={styles.emptyDescription}>
          Cerita yang sudah kamu kirim nantinya akan tampil di halaman ini.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.primaryButtonText}>
            Mulai Curhat
          </Text>
        </Pressable>
      </View>

      <View style={styles.exampleSection}>
        <Text style={styles.sectionTitle}>
          Contoh tampilan riwayat
        </Text>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>Teks</Text>
            </View>

            <Text style={styles.dateText}>
              17 Oktober 2026
            </Text>
          </View>

          <Text style={styles.historyTitle}>
            Sedih dan lelah
          </Text>

          <Text style={styles.historyText}>
            Ringkasan singkat dari cerita yang pernah dikirim akan tampil di sini.
          </Text>

          <Text style={styles.detailText}>
            Lihat hasil ›
          </Text>
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

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F1EBF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  icon: {
    fontSize: 34,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 14,
    color: '#8A8493',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },

  primaryButton: {
    height: 50,
    minWidth: 160,
    paddingHorizontal: 24,
    backgroundColor: '#8D72C3',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  exampleSection: {
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 12,
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  typeBadge: {
    backgroundColor: '#EDE5F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8067B7',
  },

  dateText: {
    fontSize: 12,
    color: '#9A94A2',
  },

  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 6,
  },

  historyText: {
    fontSize: 13,
    color: '#817A89',
    lineHeight: 19,
    marginBottom: 12,
  },

  detailText: {
    fontSize: 13,
    color: '#8067B7',
    fontWeight: '700',
  },
});