import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function HasilScreen() {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        gap: 16,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Hasil Analisis
      </Text>

      <View
        style={{
          padding: 16,
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 12,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>Emosi</Text>
        <Text>Contoh hasil emosi akan tampil di sini.</Text>
      </View>

      <View
        style={{
          padding: 16,
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 12,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>Ringkasan</Text>
        <Text>Ringkasan curhat akan tampil di sini.</Text>
      </View>

      <View
        style={{
          padding: 16,
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 12,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>Rekomendasi</Text>
        <Text>Rekomendasi dari sistem akan tampil di sini.</Text>
      </View>

      <Button
        title="Kembali ke Home"
        onPress={() => router.replace('/home')}
      />

      <Button
        title="Lihat Riwayat"
        onPress={() => router.push('/riwayat')}
      />
    </View>
  );
}