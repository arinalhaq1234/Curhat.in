import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo 👋</Text>
          <Text style={styles.title}>Apa kabar hari ini?</Text>
        </View>

        <Pressable
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.profileText}>P</Text>
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>
          Kamu tidak harus memendam semuanya sendiri.
        </Text>

        <Text style={styles.heroText}>
          Ceritakan apa yang sedang kamu rasakan. Curhat.in siap menemanimu.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Mulai Curhat</Text>

      <Pressable
        style={styles.featureCard}
        onPress={() => router.push('/curhat-text')}
      >
        <View style={styles.iconBox}>
          <Text style={styles.icon}>✍️</Text>
        </View>

        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Curhat lewat teks</Text>
          <Text style={styles.featureDescription}>
            Tulis cerita dan perasaanmu dengan nyaman.
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.featureCard}
        onPress={() => router.push('/curhat-audio')}
      >
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🎙️</Text>
        </View>

        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Curhat lewat suara</Text>
          <Text style={styles.featureDescription}>
            Ceritakan perasaanmu melalui rekaman suara.
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Menu Lainnya</Text>

      <View style={styles.menuRow}>
        <Pressable
          style={styles.smallCard}
          onPress={() => router.push('/riwayat')}
        >
          <Text style={styles.smallIcon}>🕘</Text>
          <Text style={styles.smallTitle}>Riwayat</Text>
          <Text style={styles.smallDescription}>
            Lihat cerita sebelumnya
          </Text>
        </Pressable>

        <Pressable
          style={styles.smallCard}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.smallIcon}>👤</Text>
          <Text style={styles.smallTitle}>Profil</Text>
          <Text style={styles.smallDescription}>
            Lihat informasi akun
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
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  greeting: {
    fontSize: 14,
    color: '#8A8493',
    marginBottom: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3F384A',
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EDE5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8067B7',
  },

  heroCard: {
    backgroundColor: '#EDE5F7',
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
  },

  heroTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#4E4166',
    lineHeight: 26,
    marginBottom: 8,
  },

  heroText: {
    fontSize: 14,
    color: '#72677F',
    lineHeight: 21,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 14,
  },

  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1EBF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  icon: {
    fontSize: 24,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 4,
  },

  featureDescription: {
    fontSize: 13,
    color: '#8A8493',
    lineHeight: 18,
  },

  arrow: {
    fontSize: 28,
    color: '#A89ABA',
    marginLeft: 8,
  },

  menuRow: {
    flexDirection: 'row',
    gap: 14,
  },

  smallCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  smallIcon: {
    fontSize: 24,
    marginBottom: 12,
  },

  smallTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 4,
  },

  smallDescription: {
    fontSize: 12,
    color: '#8A8493',
    lineHeight: 17,
  },
});