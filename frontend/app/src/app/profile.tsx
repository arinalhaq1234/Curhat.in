import {
  ApiError,
  getProfile,
  logoutUser,
} from '@/services/api';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
} from '@/services/session';
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

type ProfileData = {
  username: string;
  email: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError('');

        const accessToken = await getAccessToken();

        if (!accessToken) {
          await clearSession();
          router.replace('/login');
          return;
        }

        const response = await getProfile(accessToken);

        console.log('PROFILE RESPONSE:', response);

        const profileData = response.data ?? response;

        if (!profileData?.username) {
          throw new Error(
            'Data username tidak ditemukan pada respons profil.'
          );
        }

        setProfile({
          username: String(profileData.username),
          email: profileData.email
            ? String(profileData.email)
            : '',
        });
      } catch (error) {
        console.log('PROFILE ERROR:', error);

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
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    if (logoutLoading) return;

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
    ? profile.username.charAt(0).toUpperCase()
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

        <View style={styles.profileHeader}>
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
              {profile.email || 'Email belum tersedia'}
            </Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          <Pressable style={styles.actionItem}>
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

          <Pressable style={styles.actionItem}>
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

          <Pressable style={styles.actionItem}>
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
          onPress={handleLogout}
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

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.bottomNav}>
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