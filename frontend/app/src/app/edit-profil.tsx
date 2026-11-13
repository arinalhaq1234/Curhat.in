import { ApiError, getProfile, updateProfile } from '@/services/api';
import { clearSession, getAccessToken } from '@/services/session';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfilScreen() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attempt, setAttempt] = useState(0);
  const savingRef = useRef(false);
  const activeRef = useRef(false);
  const accountId = useRef<number | null>(null);

  const expired = async () => {
    await clearSession();
    if (activeRef.current) router.replace({ pathname: '/login', params: { notice: 'Sesi kamu telah berakhir. Silakan masuk kembali.' } });
  };

  useFocusEffect(useCallback(() => {
    let active = true;
    activeRef.current = true;
    setLoading(true); setReady(false); setError('');
    void (async () => {
      try {
        const token = await getAccessToken();
        if (!active) return;
        if (!token) throw new ApiError('Sesi berakhir.', 401);
        const response = await getProfile(token);
        if (!active) return;
        const data = response?.data;
        if (response?.success !== true || typeof data?.username !== 'string' || !Number.isInteger(data.id)) {
          throw new Error('Profil belum dapat dimuat.');
        }
        accountId.current = data.id;
        setUsername(data.username);
        setEmail(typeof data.email === 'string' ? data.email : '');
        setReady(true);
      } catch (caught) {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 401) { await expired(); return; }
        setError('Profil belum dapat dimuat. Periksa koneksi dan coba lagi.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; activeRef.current = false; };
  }, [attempt]));

  const save = async () => {
    if (savingRef.current || !ready) return;
    setError(''); setSuccess('');
    const value = username.trim();
    if (!value) { setError('Nama pengguna wajib diisi.'); return; }
    if (value.length > 150) { setError('Nama pengguna maksimal 150 karakter.'); return; }
    savingRef.current = true; setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) { await expired(); return; }
      // Jangan menyimpan form akun lama ke sesi akun lain.
      const current = await getProfile(token);
      if (!activeRef.current) return;
      if (current?.success !== true || current.data?.id !== accountId.current) {
        setReady(false); setError('Akun telah berubah. Muat ulang profil sebelum menyimpan.'); return;
      }
      const response = await updateProfile(value, token);
      if (!activeRef.current) return;
      if (response?.success !== true || response.data?.username !== value) {
        throw new Error('Respons penyimpanan belum valid.');
      }
      setUsername(response.data.username);
      setSuccess('Profil berhasil diperbarui.');
    } catch (caught) {
      if (!activeRef.current) return;
      if (caught instanceof ApiError && caught.status === 401) { await expired(); return; }
      setError(caught instanceof ApiError && caught.status === 400
        ? caught.message : 'Perubahan belum dapat dipastikan. Periksa koneksi dan muat ulang profil sebelum mencoba lagi.');
    } finally { savingRef.current = false; setSaving(false); }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: Math.max(54, insets.top + 16), paddingBottom: 32 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable style={styles.back} disabled={saving} onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')} accessibilityRole="button" accessibilityLabel="Kembali ke Profil">
          <Ionicons name="chevron-back" size={24} color="#8067B7" />
        </Pressable>
        <Text style={styles.title}>Edit Profil</Text>
      </View>
      {loading ? <ActivityIndicator color="#8067B7" size="large" /> : (
        <View style={styles.card}>
          {ready && <>
            <View style={styles.avatar}><Text style={styles.initial}>{Array.from(username.trim())[0]?.toUpperCase() || 'U'}</Text></View>
            <Text style={styles.label}>Nama Pengguna</Text>
            <TextInput style={styles.input} value={username} onChangeText={value => { setUsername(value); setError(''); setSuccess(''); }} editable={!saving} autoCapitalize="none" autoCorrect={false} placeholder="Masukkan nama pengguna" placeholderTextColor="#A6A0B3" accessibilityLabel="Nama Pengguna" />
            <Text style={styles.label}>Email</Text>
            <Text style={styles.email} selectable>{email || 'Email belum tersedia'}</Text>
            <Text style={styles.hint}>Email akun tidak dapat diubah.</Text>
          </>}
          {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
          {!!success && <Text style={styles.success} accessibilityLiveRegion="polite">{success}</Text>}
          {ready ? <Pressable style={[styles.save, saving && styles.disabled]} onPress={() => void save()} disabled={saving} accessibilityRole="button" accessibilityState={{ busy: saving, disabled: saving }}>
            {saving && <ActivityIndicator color="#FFFFFF" size="small" />}
            <Text style={styles.saveText}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
          </Pressable> : <Pressable style={styles.save} onPress={() => setAttempt(value => value + 1)} accessibilityRole="button"><Text style={styles.saveText}>Coba Lagi</Text></Pressable>}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8F5FC', paddingHorizontal: 22 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  title: { flex: 1, fontSize: 23, fontWeight: '700', color: '#3F384A' },
  card: { backgroundColor: '#F2EDF8', borderRadius: 22, padding: 18 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E5DAF3', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  initial: { fontSize: 32, fontWeight: '700', color: '#8067B7' },
  label: { fontSize: 14, fontWeight: '600', color: '#655775', marginTop: 18, marginBottom: 8 },
  input: { minHeight: 54, borderWidth: 1, borderColor: '#D8CDE7', borderRadius: 15, backgroundColor: '#FFFFFF', padding: 14, fontSize: 14, color: '#4A4352' },
  email: { minHeight: 54, borderRadius: 15, backgroundColor: '#EAE5F0', padding: 14, fontSize: 14, lineHeight: 22, color: '#8A8096' },
  hint: { fontSize: 12, lineHeight: 18, color: '#817A89', marginTop: 8 },
  error: { fontSize: 13, lineHeight: 20, color: '#B95050', marginTop: 12 },
  success: { fontSize: 13, lineHeight: 20, color: '#4E8A79', marginTop: 12 },
  save: { flexDirection: 'row', gap: 10, minHeight: 52, borderRadius: 15, backgroundColor: '#8067B7', padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  saveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  disabled: { opacity: 0.6 },
});
