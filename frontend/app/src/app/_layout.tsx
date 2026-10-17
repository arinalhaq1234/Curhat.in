import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="home" />
      <Stack.Screen name="curhat-text" />
      <Stack.Screen name="curhat-audio" />
      <Stack.Screen name="hasil" />
      <Stack.Screen name="riwayat" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}