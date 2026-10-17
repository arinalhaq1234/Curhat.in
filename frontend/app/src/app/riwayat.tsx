import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type FilterType = 'Semua' | 'Teks' | 'Suara';

type HistoryItem = {
  id: number;
  title: string;
  emotion: string;
  type: 'Teks' | 'Suara';
  date: string;
  time: string;
};

export default function RiwayatScreen() {
  const [activeFilter, setActiveFilter] =
    useState<FilterType>('Semua');

  const histories: HistoryItem[] = [
    {
      id: 1,
      title: 'Merasa cemas tentang kuliah',
      emotion: 'Cemas',
      type: 'Teks',
      date: '16 Okt 2026',
      time: '21:30',
    },
    {
      id: 2,
      title: 'Sedih karena masalah keluarga',
      emotion: 'Sedih',
      type: 'Suara',
      date: '14 Okt 2026',
      time: '20:15',
    },
    {
      id: 3,
      title: 'Bingung dengan masa depan',
      emotion: 'Bingung',
      type: 'Teks',
      date: '12 Okt 2026',
      time: '19:40',
    },
    {
      id: 4,
      title: 'Kesepian di lingkungan baru',
      emotion: 'Kesepian',
      type: 'Suara',
      date: '10 Okt 2026',
      time: '18:20',
    },
  ];

  const filteredHistories =
    activeFilter === 'Semua'
      ? histories
      : histories.filter(
          (item) => item.type === activeFilter
        );

  const getEmotionEmoji = (emotion: string) => {
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

    return '😐';
  };

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
          {(['Semua', 'Teks', 'Suara'] as FilterType[]).map(
            (filter) => (
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
            )
          )}
        </View>

        {/* LIST RIWAYAT */}
        <View style={styles.historyList}>
          {filteredHistories.length > 0 ? (
            filteredHistories.map((item) => (
              <Pressable
                key={item.id}
                style={styles.historyCard}
                onPress={() => router.push('/hasil')}
              >
                <View style={styles.emojiCircle}>
                  <Text style={styles.emoji}>
                    {getEmotionEmoji(item.emotion)}
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

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#AEA7B5"
                />
              </Pressable>
            ))
          ) : (
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
                Belum ada riwayat curhat untuk kategori ini.
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
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* BOTTOM NAV */}
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
});