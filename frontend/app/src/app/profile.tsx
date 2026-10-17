import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function ProfileScreen() {
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
        Profil
      </Text>

      <View
        style={{
          padding: 16,
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 12,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>Username</Text>
        <Text>Data username akan tampil di sini.</Text>
      </View>

      <View
        style={{
          padding: 16,
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 12,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>Email</Text>
        <Text>Data email akan tampil di sini.</Text>
      </View>

      <Button
        title="Logout"
        onPress={() => router.replace('/login')}
      />

      <Button
        title="Kembali"
        onPress={() => router.back()}
      />
    </View>
  );
}