import {
  ApiError,
  getProfile,
  getCachedProfile,
  logoutUser,
} from '@/services/api';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
} from '@/services/session';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ProfileData = {
  username: string;
  email: string;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const logoutRef = useRef(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    const loadProfile = async () => {
      const startedAt = Date.now();
      try {
        setError('');

        const accessToken = await getAccessToken();
        if (!active) return;

        if (!accessToken) {
          await clearSession();
          router.replace('/login');
          return;
        }

        const cached = getCachedProfile(accessToken)?.data;
        if (cached?.username) {
          setProfile({ username: cached.username, email: cached.email ?? '' });
          setTimeout(() => { if (active) setLoading(false); }, Math.max(0, 500 - (Date.now() - startedAt)));
        }

        const response = await getProfile(accessToken);
        if (!active) return;

        const profileData = response.data ?? response;

        if (!profileData?.username) {
          throw new Error(
            'Data nama pengguna tidak ditemukan pada respons profil.'
          );
        }

        setProfile({
          username: String(profileData.username),
          email: profileData.email
            ? String(profileData.email)
            : '',
        });
      } catch (error) {
        if (!active) return;

        if (error instanceof ApiError && error.status === 401) {
          await clearSession();
          router.replace('/login');
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : 'Profil gagal dimuat.'
        );
      } finally {
        const remaining = 500 - (Date.now() - startedAt);
        if (active && remaining > 0) await new Promise<void>(resolve => setTimeout(resolve, remaining));
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
      // Pulihkan snapshot hanya setelah token sesi saat ini diperiksa.
      setProfile(null);
      setLoading(true);
    };
  }, []));

  const handleLogout = async () => {
    if (logoutRef.current) return;
    logoutRef.current = true;
    setShowLogoutConfirmation(false);

    try {
      setLogoutLoading(true);

      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();

      if (accessToken && refreshToken) {
        await logoutUser(refreshToken, accessToken);
      }
    } catch (error) {
      console.log('Logout backend gagal:', error);
    } finally {
      await clearSession();

      setLogoutLoading(false);
      logoutRef.current = false;

      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#8067B7"
        />

        <Text style={styles.loadingText}>
          Memuat profil...
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          {error || 'Profil tidak dapat dimuat.'}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => router.replace('/profile')}
        >
          <Text style={styles.retryText}>
            Coba Lagi
          </Text>
        </Pressable>

        <Pressable
          style={styles.backHomeButton}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.backHomeText}>
            Kembali ke Home
          </Text>
        </Pressable>
      </View>
    );
  }

  const initial = profile.username
    ? Array.from(profile.username)[0].toUpperCase()
    : 'U';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
          Profil
        </Text>

        <Pressable style={styles.profileHeader} onPress={() => router.push('/edit-profil')} disabled={logoutLoading} accessibilityRole="button" accessibilityLabel="Edit Profil">
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initial}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile.username}
            </Text>

            <Text style={styles.email}>
              {profile.email || 'Surel belum tersedia'}
            </Text>
          </View>
          <Ionicons name="pencil-outline" size={19} color="#8067B7" />
        </Pressable>

        <View style={styles.menuCard}>
          <Pressable
            style={styles.actionItem}
            onPress={() => router.push('/keamanan-akun')}
          >
            <View style={styles.actionLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#8067B7"
                />
              </View>

              <Text style={styles.actionText}>
                Keamanan Akun
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#B1AAB8"
            />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.actionItem}
            onPress={() => router.push('/tentang-aplikasi')}
          >
            <View style={styles.actionLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#8067B7"
                />
              </View>

              <Text style={styles.actionText}>
                Tentang Aplikasi
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#B1AAB8"
            />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.actionItem}
            onPress={() => router.push('/bantuan')}
          >
            <View style={styles.actionLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color="#8067B7"
                />
              </View>

              <Text style={styles.actionText}>
                Bantuan
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#B1AAB8"
            />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.logoutItem,
            logoutLoading && styles.disabledButton,
          ]}
          onPress={() => setShowLogoutConfirmation(true)}
          disabled={logoutLoading}
        >
          <View style={styles.actionLeft}>
            <View style={styles.logoutIconBox}>
              {logoutLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#D85D68"
                />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="#D85D68"
                />
              )}
            </View>

            <Text style={styles.logoutText}>
              {logoutLoading ? 'Keluar...' : 'Keluar'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#D9B9BE"
          />
        </Pressable>

        <View style={[styles.bottomSpace, { height: styles.bottomSpace.height + insets.bottom }]} />
      </ScrollView>

      <View style={[
        styles.bottomNav,
        {
          height: styles.bottomNav.height + insets.bottom,
          paddingBottom: styles.bottomNav.paddingBottom + insets.bottom,
        },
      ]}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace('/home')}
        >
          <Ionicons
            name="home-outline"
            size={23}
            color="#A39CAB"
          />

          <Text style={styles.navText}>
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

        <Pressable style={styles.navItem}>
          <Ionicons
            name="person"
            size={23}
            color="#8067B7"
          />

          <Text style={styles.activeNavText}>
            Profil
          </Text>
        </Pressable>
      </View>
      <Modal
        visible={showLogoutConfirmation}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowLogoutConfirmation(false)}
      >
        <View style={styles.confirmOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowLogoutConfirmation(false)}
            accessibilityRole="button"
            accessibilityLabel="Tutup konfirmasi keluar"
          />
          <View style={styles.confirmCard} accessibilityViewIsModal>
            <Ionicons name="log-out-outline" size={30} color="#8067B7" />
            <Text style={styles.confirmTitle}>Keluar dari akun?</Text>
            <Text style={styles.confirmDescription}>Kamu perlu masuk kembali untuk melanjutkan menggunakan Curhat.in.</Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmCancel}
                onPress={() => setShowLogoutConfirmation(false)}
                accessibilityRole="button"
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </Pressable>
              <Pressable
                style={styles.confirmLogout}
                onPress={() => void handleLogout()}
                disabled={logoutLoading}
                accessibilityRole="button"
              >
                <Text style={styles.confirmLogoutText}>Keluar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  confirmOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(63, 56, 74, 0.35)' },
  confirmCard: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 24, backgroundColor: '#FCFAFE', alignItems: 'center' },
  confirmTitle: { fontSize: 20, fontWeight: '700', color: '#55416F', textAlign: 'center', marginTop: 14, marginBottom: 10 },
  confirmDescription: { fontSize: 14, lineHeight: 21, color: '#817A89', textAlign: 'center', marginBottom: 24 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  confirmCancel: { flex: 1, minHeight: 48, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: '#D8CDE7', justifyContent: 'center', alignItems: 'center' },
  confirmLogout: { flex: 1, minHeight: 48, padding: 12, borderRadius: 15, backgroundColor: '#8067B7', justifyContent: 'center', alignItems: 'center' },
  confirmCancelText: { fontSize: 14, fontWeight: '700', color: '#8067B7' },
  confirmLogoutText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
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
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8A8493',
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 24,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E7DDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8067B7',
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 5,
  },

  email: {
    fontSize: 13,
    color: '#8A8493',
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.025,
    shadowRadius: 7,
  },

  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1EBF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0ECF3',
  },

  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },

  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4352',
  },

  logoutItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.025,
    shadowRadius: 7,
  },

  logoutIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D85D68',
  },

  disabledButton: {
    opacity: 0.65,
  },

  bottomSpace: {
    height: 90,
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

  navText: {
    fontSize: 11,
    color: '#A39CAB',
    fontWeight: '500',
  },

  activeNavText: {
    fontSize: 11,
    color: '#8067B7',
    fontWeight: '700',
  },

  errorText: {
    color: '#B95050',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  retryButton: {
    height: 48,
    minWidth: 160,
    borderRadius: 14,
    backgroundColor: '#8067B7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  backHomeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  backHomeText: {
    color: '#8067B7',
    fontSize: 14,
    fontWeight: '600',
  },
});
