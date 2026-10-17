import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function RiwayatScreen() {
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
        Riwayat Curhat
      </Text>

      <View
        style={{
          padding: 16,
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 12,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>
          Belum ada riwayat curhat
        </Text>

        <Text style={{ marginTop: 4 }}>
          Riwayat curhat yang sudah dilakukan akan tampil di sini.
        </Text>
      </View>

      <Button
        title="Mulai Curhat"
        onPress={() => router.push('/home')}
      />

      <Button
        title="Kembali"
        onPress={() => router.back()}
      />
    </View>
  );
}