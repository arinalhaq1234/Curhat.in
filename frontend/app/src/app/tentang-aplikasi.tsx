import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TentangAplikasiScreen() {
  const insets = useSafeAreaInsets();
  const backToProfile = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(54, insets.top + 16), paddingBottom: 32 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={backToProfile}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke Profil"
        >
          <Ionicons name="chevron-back" size={24} color="#8067B7" />
        </Pressable>
        <Text style={styles.pageTitle}>Tentang Aplikasi</Text>
      </View>

      <View style={styles.introCard}>
        <Image
          source={require('../../assets/images/curhatin-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo Curhat.in"
        />
        <Text style={styles.title}>💜 Tentang Curhat.in</Text>
        <Text style={styles.emphasis}>Ruang nyaman untuk bercerita dan memahami perasaanmu.</Text>
        <Text style={styles.body}>
          Terkadang, ada banyak hal yang ingin kita ungkapkan, tetapi tidak tahu harus mulai dari mana atau kepada siapa harus bercerita.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Curhat.in hadir sebagai teman refleksi diri</Text>, tempat kamu bisa menuangkan cerita, mengenali emosi, dan mendapatkan dukungan awal melalui bantuan teknologi kecerdasan buatan (AI).
        </Text>
        <Text style={styles.body}>Di sini, setiap perasaan layak untuk dipahami.</Text>
      </View>

      <Text style={styles.sectionTitle}>✨ Apa yang Bisa Kamu Lakukan di Curhat.in?</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📝 Curhat Teks</Text>
        <Text style={styles.body}>
          Ceritakan pengalaman, pikiran, dan perasaanmu melalui tulisan. Kamu bebas menyusun cerita dengan kata-katamu sendiri.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎙️ Curhat Suara</Text>
        <Text style={styles.body}>
          Lebih nyaman berbicara daripada mengetik? Gunakan fitur rekaman suara untuk menyampaikan ceritamu secara langsung.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💜 Analisis Emosi</Text>
        <Text style={styles.body}>
          Curhat.in menggunakan AI untuk membantu mengenali emosi utama dari cerita yang kamu sampaikan, seperti bahagia, sedih, cemas, atau marah.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌱 Rekomendasi Personal</Text>
        <Text style={styles.body}>
          Setelah bercerita, kamu akan mendapatkan ringkasan, gambaran akar permasalahan, respons empatik, dan saran langkah sederhana yang dapat membantu proses refleksi diri.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🕒 Riwayat Curhat</Text>
        <Text style={styles.body}>
          Cerita dan hasil analisis yang telah tersimpan dapat kamu baca kembali melalui halaman Riwayat Curhat. Kamu juga bisa melihat perjalanan perasaanmu dari waktu ke waktu.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔒 Ceritamu, Ruang Pribadimu</Text>
        <Text style={styles.body}>
          Riwayat curhat hanya dapat diakses melalui akun yang bersangkutan. Curhat.in tidak menyediakan fitur publikasi cerita kepada pengguna lain.
        </Text>
        <Text style={styles.body}>
          Cerita yang dikirim diproses menggunakan layanan AI untuk menghasilkan analisis dan rekomendasi awal. Hindari mencantumkan informasi pribadi sensitif yang tidak diperlukan.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌷 Mengapa Curhat.in Hadir?</Text>
        <Text style={styles.body}>
          Kami percaya bahwa memahami perasaan sendiri merupakan salah satu langkah penting dalam menjaga kesejahteraan emosional.
        </Text>
        <Text style={styles.body}>
          Curhat.in dikembangkan untuk memberikan ruang bercerita yang mudah diakses, membantu pengguna mengenali perasaannya, dan mendorong refleksi diri melalui teknologi.
        </Text>
      </View>

      <View style={styles.introCard}>
        <Text style={styles.cardTitle}>ℹ️ Penting untuk Diketahui</Text>
        <Text style={styles.body}>
          Hasil analisis Curhat.in merupakan <Text style={styles.bold}>dukungan awal, bukan diagnosis klinis atau pengganti konsultasi dengan psikolog maupun tenaga kesehatan profesional</Text>.
        </Text>
        <Text style={styles.body}>
          Apabila kamu mengalami kesulitan emosional yang berat atau membutuhkan bantuan lebih lanjut, pertimbangkan untuk menghubungi tenaga profesional atau orang tepercaya.
        </Text>
      </View>

      <Text style={styles.closing}>Curhat.in — Ceritakan perasaanmu, pahami dirimu. 💜</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8F5FC', paddingHorizontal: 22 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 14, elevation: 2,
  },
  pageTitle: { flex: 1, fontSize: 23, fontWeight: '700', color: '#3F384A' },
  introCard: { backgroundColor: '#EEE5FA', borderRadius: 22, padding: 20, marginBottom: 16 },
  logo: { width: '100%', height: 100, marginBottom: 16 },
  title: { fontSize: 21, lineHeight: 29, fontWeight: '700', color: '#55416F', marginBottom: 12 },
  emphasis: { fontSize: 15, lineHeight: 23, fontWeight: '600', color: '#55416F' },
  sectionTitle: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: '#55416F', marginTop: 8, marginBottom: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14 },
  cardTitle: { fontSize: 16, lineHeight: 24, fontWeight: '700', color: '#55416F' },
  body: { fontSize: 14, lineHeight: 23, color: '#74687F', marginTop: 12 },
  bold: { fontWeight: '700' },
  closing: { fontSize: 15, lineHeight: 24, fontWeight: '700', color: '#55416F', textAlign: 'center', marginVertical: 20 },
});
