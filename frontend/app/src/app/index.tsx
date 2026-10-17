import { getAccessToken } from '@/services/session';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function Index() {
  useEffect(() => {
    const startApp = async () => {
      try {
        const accessToken = await getAccessToken();

        setTimeout(() => {
          if (accessToken) {
            router.replace('/home');
          } else {
            router.replace('/login');
          }
        }, 1800);
      } catch (error) {
        console.log('Gagal memeriksa sesi awal:', error);

        setTimeout(() => {
          router.replace('/login');
        }, 1800);
      }
    };

    startApp();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/curhatin-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>
          Tempat aman untuk bercerita dan didengarkan
        </Text>
      </View>

      <View style={styles.decorationLeft} />
      <View style={styles.decorationRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFAFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    overflow: 'hidden',
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 190,
    height: 190,
    marginBottom: -8,
  },

  subtitle: {
    fontSize: 15,
    color: '#756F80',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },

  decorationLeft: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#EEE4FA',
    bottom: -130,
    left: -100,
  },

  decorationRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FCE5EF',
    bottom: -130,
    right: -100,
  },
});