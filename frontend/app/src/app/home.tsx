import { getAccessToken } from '@/services/session';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          router.replace('/login');
          return;
        }

        setCheckingSession(false);
      } catch (error) {
        console.log('Gagal memeriksa sesi:', error);
        router.replace('/login');
      }
    };

    checkSession();
  }, []);

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#8067B7"
        />

        <Text style={styles.loadingText}>
          Memeriksa sesi...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Halo 👋
            </Text>

            <Text style={styles.title}>
              Apa kabar hari ini?
            </Text>
          </View>

          <Pressable
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons
              name="person-outline"
              size={23}
              color="#8067B7"
            />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            Bagaimana perasaanmu hari ini?
          </Text>

          <Text style={styles.heroText}>
            Yuk, ceritakan apa yang sedang kamu rasakan.
            Curhat.in siap mendengarkan.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Mulai Curhat
        </Text>

        <View style={styles.featureRow}>
          <Pressable
            style={[
              styles.featureCard,
              styles.textCard,
            ]}
            onPress={() => router.push('/curhat-text')}
          >
            <View
              style={[
                styles.iconBox,
                styles.textIconBox,
              ]}
            >
              <Ionicons
                name="create-outline"
                size={31}
                color="#D78A43"
              />
            </View>

            <Text style={styles.featureTitle}>
              Curhat Teks
            </Text>

            <Text style={styles.featureDescription}>
              Tulis cerita dan perasaanmu
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.featureCard,
              styles.audioCard,
            ]}
            onPress={() => router.push('/curhat-audio')}
          >
            <View
              style={[
                styles.iconBox,
                styles.audioIconBox,
              ]}
            >
              <Ionicons
                name="mic-outline"
                size={32}
                color="#6675CD"
              />
            </View>

            <Text style={styles.featureTitle}>
              Curhat Suara
            </Text>

            <Text style={styles.featureDescription}>
              Ceritakan lewat rekaman suara
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Riwayat Terbaru
          </Text>

          <Pressable
            onPress={() => router.push('/riwayat')}
          >
            <Text style={styles.seeAll}>
              Lihat Semua ›
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.historyCard}
          onPress={() => router.push('/riwayat')}
        >
          <View style={styles.historyIcon}>
            <Ionicons
              name="time-outline"
              size={25}
              color="#8067B7"
            />
          </View>

          <View style={styles.historyContent}>
            <Text style={styles.historyTitle}>
              Belum ada riwayat
            </Text>

            <Text style={styles.historyDescription}>
              Cerita yang kamu kirim akan tampil di sini.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#A59DAE"
          />
        </Pressable>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Ionicons
            name="home"
            size={23}
            color="#8067B7"
          />

          <Text style={styles.activeNavText}>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/riwayat')}
        >
          <Ionicons
            name="time-outline"
            size={23}
            color="#A39CAB"
          />

          <Text style={styles.navText}>
            Riwayat
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Ionicons
            name="person-outline"
            size={23}
            color="#A39CAB"
          />

          <Text style={styles.navText}>
            Profil
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F5FC',
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 28,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8A8493',
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
    fontSize: 23,
    fontWeight: '700',
    color: '#3F384A',
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },

  heroCard: {
    backgroundColor: '#EEE5FA',
    borderRadius: 24,
    padding: 22,
    minHeight: 140,
    justifyContent: 'center',
    marginBottom: 26,
  },

  heroTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#55416F',
    lineHeight: 25,
    marginBottom: 8,
  },

  heroText: {
    fontSize: 13,
    color: '#74687F',
    lineHeight: 19,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 14,
  },

  featureRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },

  featureCard: {
    flex: 1,
    borderRadius: 22,
    padding: 17,
    minHeight: 170,
  },

  textCard: {
    backgroundColor: '#FFF0D9',
  },

  audioCard: {
    backgroundColor: '#E9EEFF',
  },

  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  textIconBox: {
    backgroundColor: '#FFE2BB',
  },

  audioIconBox: {
    backgroundColor: '#DCE4FF',
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 5,
  },

  featureDescription: {
    fontSize: 12,
    color: '#817A89',
    lineHeight: 17,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  seeAll: {
    fontSize: 12,
    color: '#8067B7',
    fontWeight: '700',
    marginBottom: 14,
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },

  historyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#F1EBF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  historyContent: {
    flex: 1,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 4,
  },

  historyDescription: {
    fontSize: 12,
    color: '#8A8493',
    lineHeight: 17,
  },

  bottomSpace: {
    height: 80,
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEAF2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 7,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  activeNavText: {
    fontSize: 11,
    color: '#8067B7',
    fontWeight: '700',
  },

  navText: {
    fontSize: 11,
    color: '#A39CAB',
    fontWeight: '500',
  },
});