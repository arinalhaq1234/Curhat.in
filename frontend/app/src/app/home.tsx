import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Home Curhat.in
      </Text>

      <Button
        title="Curhat Teks"
        onPress={() => router.push('/curhat-text')}
      />

      <Button
        title="Curhat Suara"
        onPress={() => router.push('/curhat-audio')}
      />

      <Button
        title="Riwayat"
        onPress={() => router.push('/riwayat')}
      />

      <Button
        title="Profil"
        onPress={() => router.push('/profile')}
      />
    </View>
  );
}