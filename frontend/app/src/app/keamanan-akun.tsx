import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KeamananAkunScreen() {
  const insets = useSafeAreaInsets();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const selected = section === 'password' || section === 'privacy' ? section : null;

  return (
    <ScrollView
      key={selected ?? 'menu'}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(54, insets.top + 16), paddingBottom: 32 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={selected ? 'Kembali ke Keamanan Akun' : 'Kembali ke Profil'}
          onPress={() => router.canGoBack() ? router.back() : router.replace(selected ? '/keamanan-akun' : '/profile')}
        >
          <Ionicons name="chevron-back" size={24} color="#8067B7" />
        </Pressable>
        <Text style={styles.title}>{selected === 'privacy' ? 'Privasi Cerita' : selected === 'password' ? 'Ubah Kata Sandi' : 'Keamanan Akun'}</Text>
      </View>

      {!selected && (
      <>
      <Text style={styles.description}>Kelola keamanan dan akses akunmu.</Text>

      <Pressable
        style={styles.menuCard}
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/keamanan-akun', params: { section: 'password' } })}
      >
        <Ionicons name="lock-closed-outline" size={22} color="#8067B7" />
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Ubah Kata Sandi</Text>
          <Text style={styles.menuDescription}>Perbarui kata sandi akunmu</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.menuCard}
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/keamanan-akun', params: { section: 'privacy' } })}
      >
        <Ionicons name="shield-checkmark-outline" size={22} color="#8067B7" />
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Privasi Cerita</Text>
          <Text style={styles.menuDescription}>Informasi perlindungan riwayat curhat</Text>
        </View>
      </Pressable>
      </>
      )}

      {selected === 'password' && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Fitur ini belum tersedia</Text>
          <Text style={styles.infoText}>
            Perubahan kata sandi belum tersedia di Curhat.in saat ini.
          </Text>
        </View>
      )}

      {selected === 'privacy' && (
        <View style={styles.infoCard} accessibilityLiveRegion="polite">
          <Text style={styles.infoTitle}>Ceritamu adalah ruang pribadimu.</Text>
          <Text style={styles.infoText}>
            Di Curhat.in, kamu bisa mengungkapkan perasaan, pikiran, dan pengalaman pribadi dengan lebih nyaman. Setiap cerita tersimpan sebagai bagian dari riwayat akunmu, sehingga kamu dapat membacanya kembali kapan saja.
          </Text>
          <Text style={styles.infoText}>
            Kami memahami bahwa setiap cerita memiliki makna dan bersifat pribadi. Karena itu, Curhat.in dirancang untuk membantu menjaga privasi ceritamu.
          </Text>
          <Text style={styles.sectionTitle}>💜 Bagaimana Privasi Ceritamu Dijaga?</Text>
          <Text style={styles.sectionTitle}>1. Riwayat Hanya untuk Akunmu</Text>
          <Text style={styles.infoText}>
            Cerita dan hasil analisismu hanya dapat diakses melalui akun yang bersangkutan. Pengguna lain tidak dapat membuka riwayat curhat milikmu melalui akun mereka.
          </Text>
          <Text style={styles.sectionTitle}>2. Tidak Ada Fitur Berbagi Cerita</Text>
          <Text style={styles.infoText}>
            Curhat.in tidak menyediakan fitur untuk mempublikasikan atau membagikan cerita kepada pengguna lain. Ceritamu tidak ditampilkan di profil publik.
          </Text>
          <Text style={styles.sectionTitle}>3. Cerita Diproses dengan Bantuan AI</Text>
          <Text style={styles.infoText}>
            Cerita yang kamu kirim diproses menggunakan layanan AI untuk membantu mengenali emosi, memahami permasalahan, dan memberikan rekomendasi awal. Karena itu, hindari memasukkan informasi yang sangat sensitif atau tidak diperlukan.
          </Text>
          <Text style={styles.sectionTitle}>4. Riwayat Tersimpan di Akunmu</Text>
          <Text style={styles.infoText}>
            Kamu dapat membuka kembali cerita dan hasil analisis sebelumnya melalui menu Riwayat Curhat, termasuk setelah keluar dan masuk kembali menggunakan akun yang sama.
          </Text>
          <Text style={styles.sectionTitle}>🛡️ Tips Menjaga Privasi Akun</Text>
          <Text style={styles.infoText}>• Gunakan kata sandi yang kuat dan jangan membagikannya kepada orang lain.</Text>
          <Text style={styles.infoText}>• Hindari mencantumkan kata sandi, nomor identitas, atau informasi pribadi yang tidak diperlukan dalam cerita.</Text>
          <Text style={styles.infoText}>• Selalu keluar dari akun setelah selesai menggunakan perangkat bersama.</Text>
          <Text style={styles.infoText}>• Pastikan kamu masuk menggunakan akun milikmu sendiri.</Text>
          <View style={styles.divider} />
          <Text style={styles.infoTitle}>Ruang untuk bercerita, tempat untuk memahami diri. 💜</Text>
          <Text style={styles.infoText}>
            Curhat.in hadir untuk mendengarkan ceritamu dan membantu kamu mengenali perasaanmu. Hasil analisis AI merupakan dukungan awal, bukan diagnosis klinis atau pengganti bantuan profesional.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8F5FC', paddingHorizontal: 22 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 14, elevation: 2,
  },
  title: { flex: 1, fontSize: 23, fontWeight: '700', color: '#3F384A' },
  description: { fontSize: 13, lineHeight: 19, color: '#817A89', marginBottom: 22 },
  menuCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14,
  },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#4A4352', marginBottom: 6 },
  menuDescription: { fontSize: 13, lineHeight: 19, color: '#817A89' },
  infoCard: { backgroundColor: '#EEE5FA', borderRadius: 20, padding: 18, marginBottom: 14 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#55416F', marginBottom: 6 },
  infoText: { fontSize: 13, lineHeight: 20, color: '#74687F', marginTop: 6 },
  sectionTitle: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: '#55416F', marginTop: 20 },
  divider: { height: 1, backgroundColor: '#D8CDE7', marginVertical: 20 },
});
