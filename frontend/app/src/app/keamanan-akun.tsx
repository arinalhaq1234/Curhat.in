import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, changePassword } from '@/services/api';
import { clearSession, getAccessToken } from '@/services/session';

export default function KeamananAkunScreen() {
  const insets = useSafeAreaInsets();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const selected = section === 'password' || section === 'privacy' ? section : null;
  const [passwords, setPasswords] = useState({ old: '', next: '', confirm: '' });
  const [visible, setVisible] = useState({ old: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const savingRef = useRef(false);
  const activeRef = useRef(false);

  useFocusEffect(useCallback(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      setPasswords({ old: '', next: '', confirm: '' });
      setVisible({ old: false, next: false, confirm: false });
      setError('');
      setSuccess('');
    };
  }, []));

  const savePassword = async () => {
    if (savingRef.current) return;
    setError('');
    setSuccess('');
    if (!passwords.old || !passwords.next || !passwords.confirm) {
      setError('Silakan lengkapi semua kolom kata sandi.');
      return;
    }
    if (passwords.next.length < 8 || passwords.next.length > 20) {
      setError('Kata sandi baru harus terdiri dari 8–20 karakter.');
      return;
    }
    if (passwords.next === passwords.old) {
      setError('Kata sandi baru harus berbeda dari kata sandi lama.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setError('Konfirmasi kata sandi baru tidak sesuai.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    const expiredSession = async () => {
      await clearSession();
      if (activeRef.current) router.replace({ pathname: '/login', params: { notice: 'Sesi kamu telah berakhir. Silakan masuk kembali untuk mengubah kata sandi.' } });
    };
    try {
      const token = await getAccessToken();
      if (!token) { await expiredSession(); return; }
      const response = await changePassword(passwords.old, passwords.next, token);
      if (!activeRef.current) return;
      if (response?.success !== true) {
        setError('Perubahan kata sandi belum dapat dipastikan. Silakan coba masuk menggunakan kata sandimu sebelum mencoba lagi.');
        return;
      }
      setPasswords({ old: '', next: '', confirm: '' });
      setVisible({ old: false, next: false, confirm: false });
      setSuccess('Kata sandi berhasil diubah.');
    } catch (caught) {
      if (!activeRef.current) return;
      if (caught instanceof ApiError && caught.status === 401) { await expiredSession(); return; }
      if (caught instanceof ApiError && caught.status === 400) {
        setError(caught.message);
      } else if (caught instanceof ApiError && caught.status === 429) {
        setError('Terlalu banyak permintaan. Silakan coba lagi beberapa saat.');
      } else {
        setError('Perubahan kata sandi belum dapat dipastikan. Periksa koneksi dan coba masuk menggunakan kata sandi baru sebelum mencoba lagi.');
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <ScrollView
      key={selected ?? 'menu'}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(54, insets.top + 16), paddingBottom: 32 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          disabled={saving}
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
        <View style={styles.passwordCard}>
          {([
            { key: 'old', label: 'Kata Sandi Lama', placeholder: 'Masukkan kata sandi lama' },
            { key: 'next', label: 'Kata Sandi Baru', placeholder: 'Masukkan kata sandi baru' },
            { key: 'confirm', label: 'Konfirmasi Kata Sandi Baru', placeholder: 'Ulangi kata sandi baru' },
          ] as const).map(field => (
            <View key={field.key}>
              <Text style={styles.passwordLabel}>{field.label}</Text>
              <View style={styles.passwordInputRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwords[field.key]}
                  onChangeText={value => {
                    setPasswords(previous => ({ ...previous, [field.key]: value }));
                    setError(''); setSuccess('');
                  }}
                  placeholder={field.placeholder}
                  placeholderTextColor="#A6A0B3"
                  secureTextEntry={!visible[field.key]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                  accessibilityLabel={field.label}
                />
                <Pressable
                  onPress={() => setVisible(previous => ({ ...previous, [field.key]: !previous[field.key] }))}
                  disabled={saving}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`${visible[field.key] ? 'Sembunyikan' : 'Tampilkan'} ${field.label.toLowerCase()}`}
                >
                  <Ionicons name={visible[field.key] ? 'eye-off-outline' : 'eye-outline'} size={21} color="#8067B7" />
                </Pressable>
              </View>
            </View>
          ))}
          <Text style={styles.infoText}>
            {'Ketentuan kata sandi baru:\n• Terdiri dari 8–20 karakter.\n• Berbeda dari kata sandi lama.\n• Tidak terlalu mirip dengan nama pengguna atau informasi akun.\n• Bukan kata sandi yang umum digunakan.\n• Tidak hanya terdiri dari angka.\n\nGunakan kombinasi huruf besar, huruf kecil, angka, dan simbol.'}
          </Text>
          {!!error && <Text style={styles.formError} accessibilityRole="alert">{error}</Text>}
          {!!success && <Text style={styles.formSuccess} accessibilityLiveRegion="polite">{success}</Text>}
          <Pressable
            style={[styles.saveButton, saving && styles.saveDisabled]}
            onPress={() => void savePassword()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving, busy: saving }}
          >
            {saving && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan Kata Sandi'}</Text>
          </Pressable>
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
  passwordCard: { backgroundColor: '#F2EDF8', borderRadius: 22, padding: 18, marginBottom: 14 },
  passwordLabel: { fontSize: 13, fontWeight: '600', color: '#655775', marginTop: 18, marginBottom: 8 },
  passwordInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D8CDE7', borderRadius: 15, backgroundColor: '#FFFFFF' },
  passwordInput: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#4A4352' },
  eyeButton: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  saveButton: { flexDirection: 'row', gap: 10, minHeight: 52, padding: 14, borderRadius: 15, backgroundColor: '#8067B7', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  saveDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  formError: { fontSize: 13, lineHeight: 20, color: '#B95050', marginTop: 12 },
  formSuccess: { fontSize: 13, lineHeight: 20, color: '#4E8A79', marginTop: 12 },
});
