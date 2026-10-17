import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function CurhatAudioScreen() {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        gap: 16,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Curhat Suara
      </Text>

      <Text style={{ textAlign: 'center' }}>
        Rekam ceritamu melalui suara.
      </Text>

      <Button
        title="Mulai Rekam"
        onPress={() => {}}
      />

      <Button
        title="Kirim Rekaman"
        onPress={() => router.push('/hasil')}
      />

      <Button
        title="Kembali"
        onPress={() => router.back()}
      />
    </View>
  );
}