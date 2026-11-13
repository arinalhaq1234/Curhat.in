import { draftOwner, readDraft, Draft } from '@/services/drafts';
import { getAccessToken } from '@/services/session';
import { ApiError, getCurhatHistory, getCurhatHistoryDetail } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type LatestHistory = {
  id: number;
  ringkasan_cerita: string | null;
  emosi: string | null;
  waktu: string;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [checkingSession, setCheckingSession] = useState(true);
  const [latestHistory, setLatestHistory] = useState<LatestHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [openingHistory, setOpeningHistory] = useState(false);
  const requestIdRef = useRef(0);
  const openingRef = useRef(false);

  const loadLatestHistory = useCallback(async () => {
    setDrafts([]);
    const requestId = ++requestIdRef.current;
    setHistoryLoading(true);
    setHistoryError('');
    setLatestHistory(null);
    setOpeningHistory(false);
    openingRef.current = false;
    let hasSession = false;

    try {
      const accessToken = await getAccessToken();
      if (requestId !== requestIdRef.current) return;
      if (!accessToken) {
        router.replace('/login');
        return;
      }
      hasSession = true;
      setCheckingSession(false);
       const owner = await draftOwner();
       const saved = [readDraft(owner, 'text'), readDraft(owner, 'audio')]
         .filter((draft): draft is Draft => !!draft && (draft.kind === 'audio' ? !!draft.uri : !!draft.text?.trim()));
       if (requestId !== requestIdRef.current) return;
       setDrafts(saved);

      const response = await getCurhatHistory(accessToken);
      if (requestId !== requestIdRef.current) return;
      if (response?.success !== true || !Array.isArray(response.data?.results)) {
        throw new Error('Daftar riwayat dari server tidak valid.');
      }
      const latest = response.data.results[0] as LatestHistory | undefined;
      if (latest && (!Number.isInteger(latest.id) || latest.id <= 0)) {
        throw new Error('Data riwayat terbaru tidak valid.');
      }
      setLatestHistory(latest ?? null);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      if (!hasSession || (error instanceof ApiError && error.status === 401)) {
        router.replace('/login');
        return;
      }
      setHistoryError('Riwayat belum dapat dimuat. Ketuk untuk mencoba lagi.');
    } finally {
      if (requestId === requestIdRef.current) setHistoryLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadLatestHistory();
    return () => {
      requestIdRef.current += 1;
      openingRef.current = false;
    };
  }, [loadLatestHistory]));

  const openLatestHistory = async () => {
    if (historyLoading || openingRef.current) return;
    if (!latestHistory) {
      if (historyError) void loadLatestHistory();
      else router.push('/riwayat');
      return;
    }

    const requestId = requestIdRef.current;
    openingRef.current = true;
    setOpeningHistory(true);
    setHistoryError('');
    try {
      const accessToken = await getAccessToken();
      if (requestId !== requestIdRef.current) return;
      if (!accessToken) {
        router.replace('/login');
        return;
      }
      const response = await getCurhatHistoryDetail(latestHistory.id, accessToken);
      if (requestId !== requestIdRef.current) return;
      if (response?.success !== true || !response.data || typeof response.data !== 'object') {
        throw new Error('Detail riwayat dari server tidak valid.');
      }
      const detail = response.data;
      router.push({
        pathname: '/hasil',
        params: {
          from: 'riwayat',
          audio_name: detail.audio_name ?? '',
          teks: detail.teks ?? '',
          emosi: detail.emosi ?? '',
          ringkasan_cerita: detail.ringkasan_cerita ?? '',
          akar_masalah: detail.akar_masalah ?? '',
          rekomendasi: detail.rekomendasi ?? '',
          waktu: detail.waktu ?? '',
        },
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      if (error instanceof ApiError && error.status === 401) {
        router.replace('/login');
        return;
      }
      setHistoryError('Hasil analisis belum dapat dibuka. Ketuk untuk mencoba lagi.');
    } finally {
      if (requestId === requestIdRef.current) {
        openingRef.current = false;
        setOpeningHistory(false);
      }
    }
  };

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
              Senang kamu ada di sini!
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
            Setiap cerita punya tempat {'\uD83D\uDC9C'}
          </Text>

          <Text style={styles.heroText}>
            Apa pun yang kamu rasakan, Curhat.in siap menemanimu bercerita.
          </Text>
        </View>

        {drafts.map(draft => (
          <View key={draft.kind} style={styles.draftCard}>
            <View style={styles.draftHeader}>
              <Ionicons name={draft.kind === 'audio' ? 'mic-outline' : 'document-text-outline'} size={19} color="#8661B5" />
              <Text style={styles.draftTitle}>Cerita kamu masih tersimpan {'\uD83D\uDC9C'}</Text>
            </View>
              <Text style={styles.draftDescription}>
                {draft.baseline ? 'Analisis sebelumnya belum berhasil diselesaikan. ' : ''}
                {draft.kind === 'audio' ? 'Rekamanmu' : 'Ceritamu'} tetap tersimpan di perangkat ini.
              </Text>
              <Pressable
                style={styles.draftAction}
                accessibilityRole="button"
                onPress={() => router.push(draft.kind === 'audio' ? '/curhat-audio' : '/curhat-text')}
              >
                <Text style={styles.draftActionText}>Lanjutkan Cerita</Text>
              </Pressable>
          </View>
        ))}

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
          onPress={() => void openLatestHistory()}
          disabled={historyLoading || openingHistory}
        >
          <View style={styles.historyIcon}>
            {historyLoading || openingHistory ? (
              <ActivityIndicator size="small" color="#8067B7" />
            ) : (
            <Ionicons
              name="time-outline"
              size={25}
              color="#8067B7"
            />
            )}
          </View>

          <View style={styles.historyContent}>
            <Text style={styles.historyTitle} numberOfLines={1}>
              {historyLoading ? 'Memuat riwayat...'
                : latestHistory ? latestHistory.ringkasan_cerita?.trim() || 'Curhatan terbaru'
                : historyError ? 'Riwayat belum dapat dimuat'
                : 'Belum ada riwayat'}
            </Text>

            <Text style={styles.historyDescription}>
              {historyLoading ? 'Menyiapkan cerita terbarumu.'
                : openingHistory ? 'Membuka hasil analisis...'
                : historyError || (latestHistory
                  ? `${latestHistory.emosi || 'Tidak diketahui'} · ${latestHistory.waktu || '-'}`
                  : 'Cerita yang kamu kirim akan tampil di sini.')}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#A59DAE"
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

  draftCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4D6F5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  draftHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  draftTitle: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '700', color: '#4A3E59' },
  draftDescription: { fontSize: 13, lineHeight: 20, color: '#81738F', marginTop: 10 },
  draftAction: { marginTop: 12, paddingVertical: 14, paddingHorizontal: 16, minHeight: 48, borderRadius: 15, backgroundColor: '#8661B5', alignItems: 'center', justifyContent: 'center' },
  draftActionText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

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
