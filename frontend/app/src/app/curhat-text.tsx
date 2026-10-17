import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function CurhatTextScreen() {
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
          <Text style={styles.title}>Curhat lewat teks</Text>
          <Text style={styles.subtitle}>
            Ceritakan apa pun yang sedang kamu rasakan.
          </Text>
        </View>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>
          Ruang ini untukmu
        </Text>

        <Text style={styles.messageText}>
          Tulis dengan nyaman. Tidak perlu menyusun kata-kata dengan sempurna.
        </Text>
      </View>

      <Text style={styles.label}>Ceritamu</Text>

      <TextInput
        placeholder="Ceritakan apa yang sedang terjadi dan bagaimana perasaanmu..."
        placeholderTextColor="#A6A0B3"
        multiline
        textAlignVertical="top"
        style={styles.textArea}
        editable={!loading}
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💜</Text>

        <Text style={styles.infoText}>
          Ceritamu akan diproses untuk membantu memahami emosi dan memberikan
          respons yang sesuai.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color="#8D72C3"
          />

          <Text style={styles.loadingTitle}>
            Sedang menganalisis ceritamu...
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
              Kirim Curhat
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

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#514A5B',
    marginBottom: 10,
  },

  textArea: {
    minHeight: 220,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DDEF',
    borderRadius: 20,
    padding: 18,
    fontSize: 15,
    color: '#3F384A',
    lineHeight: 22,
    marginBottom: 16,
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FBF9FD',
    borderRadius: 16,
    padding: 14,
    marginBottom: 28,
  },

  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#817A89',
    lineHeight: 18,
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