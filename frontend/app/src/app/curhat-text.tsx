import { router } from 'expo-router';
import { Button, Text, TextInput, View } from 'react-native';

export default function CurhatTextScreen() {
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
        Curhat Teks
      </Text>

      <TextInput
        placeholder="Ceritakan apa yang kamu rasakan..."
        multiline
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 12,
          padding: 16,
          minHeight: 160,
          textAlignVertical: 'top',
        }}
      />

      <Button
        title="Kirim Curhat"
        onPress={() => router.push('/hasil')}
      />

      <Button
        title="Kembali"
        onPress={() => router.back()}
      />
    </View>
  );
}