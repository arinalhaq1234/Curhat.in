import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Daftar Curhat.in
      </Text>

      <Button
        title="Daftar"
        onPress={() => router.replace('/login')}
      />

      <Button
        title="Kembali ke Login"
        onPress={() => router.back()}
      />
    </View>
  );
}