import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function CurhatAudioScreen() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.push('/hasil');
    }, 1500);
  };

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
          <Text style={styles.title}>Curhat lewat suara</Text>
          <Text style={styles.subtitle}>
            Ceritakan perasaanmu melalui rekaman suara.
          </Text>
        </View>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>
          Bicara dengan nyaman
        </Text>

        <Text style={styles.messageText}>
          Rekam ceritamu dengan tenang. Kamu bisa mengulang rekaman sebelum mengirimnya.
        </Text>
      </View>

      <View style={styles.recordCard}>
        <View style={styles.micCircle}>
          <Text style={styles.micIcon}>🎙️</Text>
        </View>

        <Text style={styles.recordTitle}>
          Siap merekam
        </Text>

        <Text style={styles.recordDescription}>
          Tekan tombol di bawah untuk mulai merekam ceritamu.
        </Text>

        <Pressable
          style={styles.recordButton}
          onPress={() => {}}
          disabled={loading}
        >
          <Text style={styles.recordButtonText}>
            Mulai Rekam
          </Text>
        </Pressable>
      </View>

      <View style={styles.audioInfo}>
        <Text style={styles.audioInfoTitle}>
          Rekaman
        </Text>

        <Text style={styles.audioInfoText}>
          Belum ada rekaman.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color="#8D72C3"
          />

          <Text style={styles.loadingTitle}>
            Sedang menganalisis rekamanmu...
          </Text>

          <Text style={styles.loadingText}>
            Tunggu sebentar, ya.
          </Text>
        </View>
      ) : (
        <>
          <Pressable
            style={styles.primaryButton}
            onPress={handleSubmit}
          >
            <Text style={styles.primaryButtonText}>
              Kirim Rekaman
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>
              Batal
            </Text>
          </Pressable>
        </>
      )}
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

  messageCard: {
    backgroundColor: '#EDE5F7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },

  messageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#514267',
    marginBottom: 6,
  },

  messageText: {
    fontSize: 14,
    color: '#756A81',
    lineHeight: 21,
  },

  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  micCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1EBF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  micIcon: {
    fontSize: 38,
  },

  recordTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 8,
  },

  recordDescription: {
    fontSize: 14,
    color: '#8A8493',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },

  recordButton: {
    backgroundColor: '#EDE5F7',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },

  recordButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8067B7',
  },

  audioInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },

  audioInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#514A5B',
    marginBottom: 5,
  },

  audioInfoText: {
    fontSize: 13,
    color: '#8A8493',
  },

  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },

  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4352',
    marginTop: 14,
    marginBottom: 6,
  },

  loadingText: {
    fontSize: 13,
    color: '#8A8493',
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