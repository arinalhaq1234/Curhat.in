
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ApiError,
  getCurhatHistory,
  getCurhatHistoryDetail,
} from '@/services/api';
import { getAccessToken } from '@/services/session';

type FilterType = 'Semua' | 'Teks' | 'Suara';

type HistoryItem = {
  id: number;
  title: string;
  emotion: string;
  type: 'Teks' | 'Suara';
  date: string;
  time: string;
};

// Sesuai RiwayatCurhatListSerializer Django
type HistoryApiItem = {
  id: number;
  jenis: 'teks' | 'audio';
  emosi: string | null;
  ringkasan_cerita: string | null;
  audio_name: string | null;
  waktu: string;
};

// Sesuai curhat_history() di views.py
type HistoryApiResponse = {
  success: boolean;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: HistoryApiItem[];
  };
};

// Sesuai RiwayatCurhatSerializer Django
type HistoryDetail = {
  id: number;
  teks: string | null;
  audio_name: string | null;
  emosi: string | null;
  ringkasan_cerita: string | null;
  akar_masalah: string | null;
  rekomendasi: string | null;
  waktu: string;
};

type HistoryDetailResponse = {
  success: boolean;
  message: string;
  data: HistoryDetail;
};

// Backend mengirim tanggal: DD-MM-YYYY HH:mm:ss
function formatHistoryDate(value: string): {
  date: string;
  time: string;
} {
  if (!value) {
    return { date: '-', time: '-' };
  }

  const match = value.match(
    /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
  );

  if (!match) {
    return { date: value, time: '-' };
  }

  const [, day, month, year, hour, minute] = match;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr',
    'Mei', 'Jun', 'Jul', 'Agu',
    'Sep', 'Okt', 'Nov', 'Des',
  ];

  const monthIndex = Number(month) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    return { date: value, time: '-' };
  }

  return {
    date: `${Number(day)} ${monthNames[monthIndex]} ${year}`,
    time: `${hour}:${minute}`,
  };
}

// Mengubah respons Django menjadi data untuk UI lama
function mapHistoryItem(
  record: HistoryApiItem
): HistoryItem | null {
  const id = Number(record.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const summary =
    typeof record.ringkasan_cerita === 'string'
      ? record.ringkasan_cerita.trim()
      : '';

  const emotion =
    typeof record.emosi === 'string' &&
    record.emosi.trim()
      ? record.emosi.trim()
      : 'Tidak diketahui';

  const formatted = formatHistoryDate(
    record.waktu || ''
  );

  return {
    id,
    title: summary
      ? summary.replace(/\s+/g, ' ')
      : 'Curhat tanpa ringkasan',
    emotion,
    type: record.jenis === 'audio'
      ? 'Suara'
      : 'Teks',
    date: formatted.date,
    time: formatted.time,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Sesi kamu telah berakhir. Silakan login kembali.';
    }

    if (error.status === 403) {
      return 'Kamu tidak memiliki akses ke riwayat ini.';
    }

    if (error.status === 404) {
      return 'Riwayat curhat tidak ditemukan.';
    }

    return error.message ||
      'Gagal mengambil riwayat curhat.';
  }

  if (error instanceof Error) {
    if (
      error.message.includes('Network request failed') ||
      error.message.includes('fetch failed')
    ) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi dan backend.';
    }

    return error.message;
  }

  return 'Terjadi kesalahan saat mengambil riwayat.';
}

function getEmotionEmoji(emotion: string) {
  const value = emotion.toLowerCase();

  if (value.includes('senang')) return '😄';
  if (value.includes('bahagia')) return '😊';
  if (value.includes('sedih')) return '😢';
  if (value.includes('cemas')) return '😟';
  if (value.includes('khawatir')) return '😟';
  if (value.includes('marah')) return '😠';
  if (value.includes('kesal')) return '😤';
  if (value.includes('tertekan')) return '😣';
  if (value.includes('stres')) return '😫';
  if (value.includes('takut')) return '😨';
  if (value.includes('kecewa')) return '😞';
  if (value.includes('bingung')) return '😕';
  if (value.includes('lelah')) return '😮‍💨';
  if (value.includes('tenang')) return '😌';
  if (value.includes('malu')) return '😳';
  if (value.includes('kesepian')) return '😔';
  if (value.includes('semangat')) return '🤩';
  if (value.includes('terkejut')) return '😮';
  if (value.includes('bosan')) return '🥱';

  return '😐';
}

export default function RiwayatScreen() {
  const [activeFilter, setActiveFilter] =
    useState<FilterType>('Semua');

  const [histories, setHistories] =
    useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openingId, setOpeningId] =
    useState<number | null>(null);

  const [error, setError] = useState('');
  const [errorSource, setErrorSource] =
    useState<'list' | 'detail' | null>(null);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const requestIdRef = useRef(0);
  const openingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const redirectToLogin = useCallback(() => {
    router.replace('/login');
  }, []);

  // Mengambil daftar riwayat dari backend
  const loadHistory = useCallback(
    async (requestedPage = 1) => {
      const requestId = ++requestIdRef.current;
      const isFirstPage = requestedPage === 1;

      if (isFirstPage) {
        setLoading(true);
        setError('');
        setErrorSource(null);
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        const token = await getAccessToken();

        if (!token) {
          redirectToLogin();
          return;
        }

        const response =
          await getCurhatHistory(
            token,
            requestedPage
          ) as HistoryApiResponse;

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (
          response.success !== true ||
          !Array.isArray(response.data?.results)
        ) {
          throw new Error(
            'Format daftar riwayat dari server tidak valid.'
          );
        }

        const mapped = response.data.results
          .map(mapHistoryItem)
          .filter(
            (item): item is HistoryItem =>
              item !== null
          );

        setHistories((previous) => {
          if (isFirstPage) {
            return mapped;
          }

          const existingIds = new Set(
            previous.map((item) => item.id)
          );

          const newItems = mapped.filter(
            (item) => !existingIds.has(item.id)
          );

          return [...previous, ...newItems];
        });

        setPage(requestedPage);
        setHasNext(Boolean(response.data.next));
        setError('');
        setErrorSource(null);
      } catch (caughtError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (
          caughtError instanceof ApiError &&
          caughtError.status === 401
        ) {
          redirectToLogin();
          return;
        }

        setError(getErrorMessage(caughtError));
        setErrorSource('list');
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [redirectToLogin]
  );

  // Muat ulang daftar setiap kali halaman dibuka
  useFocusEffect(
    useCallback(() => {
      loadHistory(1);

      return () => {
        requestIdRef.current += 1;
        loadingMoreRef.current = false;
      };
    }, [loadHistory])
  );

  // Pagination 10 item per halaman sesuai backend
  const handleLoadMore = async () => {
    if (
      loading ||
      loadingMoreRef.current ||
      !hasNext
    ) {
      return;
    }

    await loadHistory(page + 1);
  };

  // Mengambil detail tersimpan, tanpa Gemini
  const handleOpenHistory = async (
    curhatId: number
  ) => {
    if (openingRef.current) {
      return;
    }

    openingRef.current = true;
    setOpeningId(curhatId);
    setError('');
    setErrorSource(null);

    try {
      const token = await getAccessToken();

      if (!token) {
        redirectToLogin();
        return;
      }

      const response =
        await getCurhatHistoryDetail(
          curhatId,
          token
        ) as HistoryDetailResponse;

      if (
        response.success !== true ||
        !response.data ||
        typeof response.data !== 'object'
      ) {
        throw new Error(
          'Detail riwayat dari server tidak valid.'
        );
      }

      const detail = response.data;

      // Parameter berikut sesuai hasil.tsx
      router.push({
        pathname: '/hasil',
        params: {
          teks: detail.teks ?? '',
          emosi: detail.emosi ?? '',
          ringkasan_cerita:
            detail.ringkasan_cerita ?? '',
          akar_masalah:
            detail.akar_masalah ?? '',
          rekomendasi:
            detail.rekomendasi ?? '',
          waktu: detail.waktu ?? '',
        },
      });
    } catch (caughtError) {
      if (
        caughtError instanceof ApiError &&
        caughtError.status === 401
      ) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(caughtError));
      setErrorSource('detail');
    } finally {
      openingRef.current = false;
      setOpeningId(null);
    }
  };

  const filteredHistories =
    activeFilter === 'Semua'
      ? histories
      : histories.filter(
          (item) => item.type === activeFilter
        );

  return (
    <View style={styles.screen}>
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

          <Text style={styles.title}>
            Riwayat Curhat
          </Text>
        </View>

        {/* FILTER */}
        <View style={styles.filterRow}>
          {(
            ['Semua', 'Teks', 'Suara'] as FilterType[]
          ).map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter &&
                  styles.activeFilterButton,
              ]}
              onPress={() =>
                setActiveFilter(filter)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter &&
                    styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* PESAN ERROR */}
        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              onPress={() => {
                if (errorSource === 'list') {
                  loadHistory(page);
                } else {
                  setError('');
                  setErrorSource(null);
                }
              }}
            >
              <Text style={styles.retryText}>
                {errorSource === 'list'
                  ? 'Coba Lagi'
                  : 'Tutup Pesan'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* LOADING */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#8067B7"
            />

            <Text style={styles.loadingText}>
              Memuat riwayat curhat...
            </Text>
          </View>
        ) : (
          <>
            {/* LIST RIWAYAT */}
            <View style={styles.historyList}>
              {filteredHistories.length > 0 ? (
                filteredHistories.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.historyCard}
                    disabled={openingId !== null}
                    onPress={() =>
                      handleOpenHistory(item.id)
                    }
                  >
                    <View style={styles.emojiCircle}>
                      <Text style={styles.emoji}>
                        {getEmotionEmoji(
                          item.emotion
                        )}
                      </Text>
                    </View>

                    <View style={styles.historyContent}>
                      <Text
                        style={styles.historyTitle}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>

                      <View style={styles.metaRow}>
                        <View style={styles.typeWrapper}>
                          <Ionicons
                            name={
                              item.type === 'Teks'
                                ? 'document-text-outline'
                                : 'mic-outline'
                            }
                            size={13}
                            color="#8E8798"
                          />

                          <Text style={styles.metaText}>
                            {item.type}
                          </Text>
                        </View>

                        <Text style={styles.dot}>
                          •
                        </Text>

                        <Text style={styles.metaText}>
                          {item.date}
                        </Text>

                        <Text style={styles.dot}>
                          •
                        </Text>

                        <Text style={styles.metaText}>
                          {item.time}
                        </Text>
                      </View>
                    </View>

                    {openingId === item.id ? (
                      <ActivityIndicator
                        size="small"
                        color="#8067B7"
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#AEA7B5"
                      />
                    )}
                  </Pressable>
                ))
              ) : (
                !error && (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIcon}>
                      <Ionicons
                        name="time-outline"
                        size={35}
                        color="#8067B7"
                      />
                    </View>

                    <Text style={styles.emptyTitle}>
                      Belum ada riwayat
                    </Text>

                    <Text style={styles.emptyDescription}>
                      {activeFilter === 'Semua'
                        ? 'Belum ada riwayat curhat yang tersimpan.'
                        : 'Belum ada riwayat curhat untuk kategori ini.'}
                    </Text>

                    <Pressable
                      style={styles.primaryButton}
                      onPress={() =>
                        router.replace('/home')
                      }
                    >
                      <Text
                        style={styles.primaryButtonText}
                      >
                        Mulai Curhat
                      </Text>
                    </Pressable>
                  </View>
                )
              )}
            </View>

            {/* PAGINATION */}
            {hasNext && (
              <Pressable
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color="#8067B7"
                  />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Muat Riwayat Lainnya
                  </Text>
                )}
              </Pressable>
            )}
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.replace('/home')
          }
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

        <Pressable style={styles.navItem}>
          <Ionicons
            name="time"
            size={23}
            color="#8067B7"
          />

          <Text style={styles.activeNavText}>
            Riwayat
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push('/profile')
          }
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
    paddingTop: 54,
    paddingBottom: 28,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
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

  title: {
    fontSize: 23,
    fontWeight: '700',
    color: '#3F384A',
  },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#EFEAF4',
    borderRadius: 16,
    padding: 4,
    marginBottom: 22,
  },

  filterButton: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeFilterButton: {
    backgroundColor: '#9D77DC',
  },

  filterText: {
    fontSize: 13,
    color: '#817A89',
    fontWeight: '600',
  },

  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  historyList: {
    gap: 12,
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },

  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1EBF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  emoji: {
    fontSize: 25,
  },

  historyContent: {
    flex: 1,
    paddingRight: 8,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 7,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  typeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaText: {
    fontSize: 11,
    color: '#918A99',
  },

  dot: {
    fontSize: 11,
    color: '#B0AAB5',
    marginHorizontal: 5,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F1EBF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 13,
    color: '#8A8493',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },

  primaryButton: {
    height: 48,
    minWidth: 150,
    backgroundColor: '#8D72C3',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  bottomSpace: {
    height: 85,
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

  // Tampilan loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    gap: 12,
  },

  loadingText: {
    fontSize: 13,
    color: '#817A89',
  },

  // Tampilan error
  errorCard: {
    backgroundColor: '#FFF1F1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },

  errorText: {
    fontSize: 13,
    color: '#A14343',
    lineHeight: 19,
  },

  retryText: {
    color: '#8067B7',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },

  // Tombol pagination
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFEAF4',
    borderRadius: 14,
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 18,
  },

  loadMoreText: {
    color: '#8067B7',
    fontSize: 13,
    fontWeight: '700',
  },
});
