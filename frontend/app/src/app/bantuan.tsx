import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const faqGroups = [
  {
    title: '📖 Panduan Penggunaan',
    items: [
      {
        id: 1,
        question: 'Bagaimana cara mulai curhat?',
        answer: 'Buka halaman Home, kemudian pilih Curhat Teks untuk menulis cerita atau Curhat Suara untuk merekam ceritamu. Setelah dikirim dan berhasil diproses, hasil analisis akan ditampilkan.',
      },
      {
        id: 2,
        question: 'Apa perbedaan Curhat Teks dan Curhat Suara?',
        answer: 'Curhat Teks memungkinkan kamu menyampaikan perasaan melalui tulisan, sedangkan Curhat Suara memungkinkan kamu bercerita melalui rekaman suara.',
      },
      {
        id: 3,
        question: 'Mengapa hasil analisis membutuhkan waktu?',
        answer: 'Curhat.in menggunakan teknologi AI untuk memproses cerita, mengenali emosi, dan menyusun rekomendasi. Waktu pemrosesan dapat berbeda tergantung kondisi koneksi dan layanan.',
      },
    ],
  },
  {
    title: '🎙️ Curhat Suara',
    items: [
      {
        id: 4,
        question: 'Berapa lama durasi rekaman suara?',
        answer: 'Durasi rekaman minimal 3 menit dan maksimal 10 menit, dengan ukuran file maksimal 15 MB.',
      },
      {
        id: 5,
        question: 'Mengapa rekaman suara tidak dapat diproses?',
        answer: 'Pastikan suara terdengar jelas, rekaman berisi pengalaman atau perasaan pribadi, dan tidak didominasi musik atau kebisingan. Kamu dapat merekam ulang jika diperlukan.',
      },
    ],
  },
  {
    title: '🕒 Riwayat Curhat',
    items: [
      {
        id: 6,
        question: 'Bagaimana cara melihat cerita sebelumnya?',
        answer: 'Buka menu Riwayat untuk melihat daftar curhatan yang tersimpan. Pilih salah satu cerita untuk membaca kembali isi cerita dan hasil analisisnya.',
      },
      {
        id: 7,
        question: 'Apakah riwayat tetap tersedia setelah keluar dari akun?',
        answer: 'Ya. Riwayat yang tersimpan tetap dapat diakses saat kamu masuk kembali menggunakan akun yang sama.',
      },
      {
        id: 8,
        question: 'Apakah pengguna lain dapat melihat riwayat curhat saya?',
        answer: 'Riwayat curhat hanya dapat diakses melalui akun pemiliknya. Pengguna lain tidak dapat membuka riwayat tersebut melalui akun mereka.',
      },
    ],
  },
  {
    title: '🔐 Akun dan Keamanan',
    items: [
      {
        id: 9,
        question: 'Bagaimana jika saya lupa kata sandi?',
        answer: 'Fitur pemulihan kata sandi belum tersedia di aplikasi. Untuk sementara, pastikan kamu menyimpan informasi akun dengan aman.',
      },
      {
        id: 10,
        question: 'Bagaimana cara keluar dari akun?',
        answer: 'Buka halaman Profil, lalu pilih tombol Keluar untuk mengakhiri sesi akunmu.',
      },
    ],
  },
  {
    title: '🌱 Tentang Hasil Analisis',
    items: [
      {
        id: 11,
        question: 'Apakah hasil analisis Curhat.in merupakan diagnosis psikologis?',
        answer: 'Tidak. Hasil analisis merupakan dukungan awal untuk membantu memahami emosi dan melakukan refleksi diri, bukan diagnosis klinis atau pengganti bantuan tenaga profesional.',
      },
      {
        id: 12,
        question: 'Apa yang harus dilakukan jika hasil analisis kurang sesuai?',
        answer: 'Hasil AI tidak selalu sempurna. Kamu dapat menggunakan hasilnya sebagai bahan refleksi, tetapi tidak harus mengikuti setiap rekomendasi. Jika membutuhkan bantuan lebih lanjut, pertimbangkan untuk berkonsultasi dengan tenaga profesional.',
      },
    ],
  },
];

export default function BantuanScreen() {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number[]>([]);
  const backToProfile = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  const toggleQuestion = (id: number) => {
    setExpanded((previous) => previous.includes(id)
      ? previous.filter((item) => item !== id)
      : [...previous, id]);
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
        <Text style={styles.pageTitle}>Bantuan</Text>
      </View>

      <View style={styles.introCard}>
        <Text style={styles.emphasis}> 💜 Ada yang ingin kamu ketahui?</Text>
        <Text style={styles.body}>
          Kami siap membantumu memahami cara menggunakan Curhat.in. Temukan jawaban atas pertanyaan umum seputar fitur, akun, dan riwayat curhat di bawah ini.
        </Text>
      </View>

      {faqGroups.map((group) => (
        <View key={group.title}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{group.title}</Text>
          {group.items.map((item) => {
            const isExpanded = expanded.includes(item.id);
            return (
              <View key={item.id} style={styles.faqCard}>
                <Pressable
                  style={styles.questionButton}
                  onPress={() => toggleQuestion(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <Text style={styles.question}>{item.id}. {item.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#8067B7"
                  />
                </Pressable>
                {isExpanded && <Text style={styles.answer}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.supportCard}>
        <Text style={styles.emphasis}>Masih membutuhkan bantuan? 💜</Text>
        <Text style={styles.body}>
          Pastikan aplikasi dan koneksi internet berjalan dengan baik. Jika terjadi kendala, kamu dapat mencoba membuka ulang aplikasi atau masuk kembali ke akunmu.
        </Text>
      </View>
      <Text style={styles.closing}>Curhat.in — Ceritakan perasaanmu, pahami dirimu.</Text>
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
  title: { fontSize: 21, lineHeight: 29, fontWeight: '700', color: '#55416F', marginBottom: 12 },
  emphasis: { fontSize: 15, lineHeight: 23, fontWeight: '700', color: '#55416F' },
  body: { fontSize: 14, lineHeight: 23, color: '#74687F', marginTop: 12 },
  sectionTitle: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: '#55416F', marginTop: 12, marginBottom: 14 },
  faqCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, overflow: 'hidden' },
  questionButton: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, minHeight: 60 },
  question: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: '600', color: '#4A4352' },
  answer: { fontSize: 14, lineHeight: 23, color: '#74687F', paddingHorizontal: 18, paddingBottom: 18 },
  supportCard: { backgroundColor: '#EEE5FA', borderRadius: 22, padding: 20, marginTop: 12 },
  closing: { fontSize: 15, lineHeight: 24, fontWeight: '700', color: '#55416F', textAlign: 'center', marginTop: 24 },
});
