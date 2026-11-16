import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

export default function AnalysisWaiting({ audio = false }: { audio?: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const messages = [
    'Kamu bisa beristirahat sejenak sambil menunggu.',
    `${audio ? 'Rekamanmu' : 'Ceritamu'} tetap tersimpan di perangkat ini.`,
    'Tidak perlu mengirim ulang selama analisis berlangsung.',
  ];

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) setReduceMotion(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reduceMotion) { pulse.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.1, duration: 1100, useNativeDriver: true, isInteraction: false }),
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse, reduceMotion]);

  useEffect(() => {
    const timer = setInterval(() => setMessageIndex(index => (index + 1) % 3), 6500);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.content}>
      <Animated.View style={[styles.heartCircle, { transform: [{ scale: pulse }] }]} accessible={false}>
        <Ionicons name="heart" size={34} color="#9A72C7" />
      </Animated.View>
      <Text style={styles.title}>Sabar ya, analisis ceritamu membutuhkan waktu lebih lama.</Text>
      <View style={styles.status}>
        <ActivityIndicator size="small" color="#8D72C3" />
        <Text style={styles.statusText}>Masih menunggu respons AI...</Text>
      </View>
      <Text style={styles.message}>{messages[messageIndex]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', alignItems: 'center' },
  heartCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#F1E8FA', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  title: { fontSize: 17, lineHeight: 25, fontWeight: '700', color: '#55416F', textAlign: 'center', marginTop: 16 },
  description: { fontSize: 13, lineHeight: 20, color: '#817A89', textAlign: 'center', marginTop: 8 },
  status: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  statusText: { fontSize: 12, lineHeight: 19, color: '#8067B7' },
  message: { fontSize: 12, lineHeight: 19, color: '#817A89', textAlign: 'center', marginTop: 14, minHeight: 38 },
});
