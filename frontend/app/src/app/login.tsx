import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function LoginScreen() {
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
        Login Curhat.in
      </Text>

      <Button
        title="Masuk"
        onPress={() => router.push('/home')}
      />

      <Button
        title="Daftar"
        onPress={() => router.push('/register')}
      />
    </View>
  );
}