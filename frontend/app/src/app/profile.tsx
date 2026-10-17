import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>
            Informasi akun Curhat.in kamu.
          </Text>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>S</Text>
        </View>

        <Text style={styles.name}>
          Syifa Amalia
        </Text>

        <Text style={styles.email}>
          syifa@example.com
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Informasi Akun
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Username</Text>
          <Text style={styles.infoValue}>
            syifa
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>
            syifa@example.com
          </Text>
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteIcon}>💜</Text>

        <View style={styles.noteContent}>
          <Text style={styles.noteTitle}>
            Curhat.in
          </Text>

          <Text style={styles.noteText}>
            Terima kasih sudah menggunakan Curhat.in sebagai tempat untuk
            bercerita dan memahami perasaanmu.
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.logoutButton}
        onPress={() => router.replace('/login')}
      >
        <Text style={styles.logoutText}>
          Keluar
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F5FC',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  backText: {
    fontSize: 30,
    color: '#8067B7',
    marginTop: -2,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: '#8A8493',
    lineHeight: 20,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#EDE5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  avatarText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#8067B7',
  },

  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4352',
    marginBottom: 5,
  },

  email: {
    fontSize: 14,
    color: '#8A8493',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3F384A',
    marginBottom: 12,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
  },

  infoItem: {
    paddingVertical: 8,
  },

  infoLabel: {
    fontSize: 12,
    color: '#9A94A2',
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A4352',
  },

  divider: {
    height: 1,
    backgroundColor: '#EFEAF3',
    marginVertical: 10,
  },

  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#EDE5F7',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },

  noteIcon: {
    fontSize: 22,
    marginRight: 12,
  },

  noteContent: {
    flex: 1,
  },

  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#514267',
    marginBottom: 5,
  },

  noteText: {
    fontSize: 13,
    color: '#756A81',
    lineHeight: 19,
  },

  logoutButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DDF1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8067B7',
  },
});