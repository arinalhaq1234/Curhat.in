
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { File, Paths } from 'expo-file-system';

import { sendAudioCurhat } from '@/services/api';
import {
  clearSession,
  getAccessToken,
} from '@/services/session';

const MIN_DURATION_MS = 3 * 60 * 1000;
const MAX_DURATION_MS = 10 * 60 * 1000;
const MAX_FILE_SIZE = 15_000_000;

const formatAudioWarning = (message: string) => {
  // Alasan spesifik hanya ditampilkan jika backend memang menyebutkannya.
  if (/lagu|musik|instrumen/i.test(message)) {
    return 'Rekaman terdengar berisi lagu atau musik. Coba rekam ulang dan ceritakan pengalaman atau perasaanmu sendiri tanpa musik latar.';
  }
  if (/berisik|bising|ramai|kebisingan|tidak (?:dapat )?terdengar|tidak (?:dapat )?dipahami|suara.*(?:tidak|kurang) jelas/i.test(message)) {
    return 'Curhatanmu belum terdengar jelas. Coba rekam ulang di tempat yang lebih tenang, hindari keramaian, dan dekatkan mikrofon saat bercerita.';
  }
  if (/materi|presentasi|ceramah|pembelajaran|pelajaran/i.test(message)) {
    return 'Rekaman terdengar seperti penyampaian materi atau presentasi. Coba ceritakan pengalaman dan perasaanmu sendiri dengan kata-katamu, ya.';
  }
  if (/bukan.*curhat|tidak.*(?:curhat|percakapan)|curhat.*(?:tidak|belum).*dikenali/i.test(message)) {
    return 'Rekaman belum dikenali sebagai curhatan. Coba bercerita dengan jelas di tempat tenang. Hindari lagu, musik, atau pembacaan materi/presentasi.';
  }
  return message || 'Rekaman belum dapat diproses. Pastikan suara terdengar jelas dan rekaman berisi ceritamu sendiri.';
};

export default function CurhatAudioScreen() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [hasActiveRecording, setHasActiveRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(31).fill(0.04));
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const audioRecorder = useAudioRecorder(
    {
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
      // ADTS dapat diputar saat dijeda tanpa memfinalisasi recorder Android.
      // Codec/kualitas tetap AAC; api.ts mengemasnya menjadi M4A saat upload.
      android: {
        ...RecordingPresets.HIGH_QUALITY.android,
        extension: '.aac',
        outputFormat: 'aac_adts',
      },
    }
  );

  const recorderState = useAudioRecorderState(
    audioRecorder,
    500
  );

  const audioPlayer = useAudioPlayer(null, {
    updateInterval: 500,
  });

  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const processingRef = useRef(false);
  const stoppingRef = useRef(false);
  const submittingRef = useRef(false);
  const latestDurationRef = useRef(0);
  const previewUriRef = useRef<string | null>(null);
  // Ref berubah langsung, sehingga handler dengan state React lama tetap aman.
  const phaseRef = useRef<'idle' | 'recording' | 'paused' | 'finished'>('idle');

  const isRecording = recorderState.isRecording;
  const isPlaying = playerStatus.playing;

  useEffect(() => {
    if (!hasActiveRecording || isPaused || !recorderState.isRecording) return;
    const level = recorderState.metering;
    if (typeof level !== 'number' || !Number.isFinite(level)) return;
    const amplitude = Math.max(0.04, Math.min(1, (level + 60) / 60));
    setWaveform((previous) => [...previous.slice(1), amplitude]);
  }, [hasActiveRecording, isPaused, recorderState.isRecording,
    recorderState.durationMillis, recorderState.metering]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () =>
      loading || submittingRef.current || hasActiveRecording
    );
    return () => subscription.remove();
  }, [loading, hasActiveRecording]);

  // MENYIMPAN DURASI SAAT REKAMAN DIJEDA
  useEffect(() => {
    if (hasActiveRecording) {
      latestDurationRef.current = Math.max(
        latestDurationRef.current,
        audioRecorder.getStatus().durationMillis
      );
    }
  }, [hasActiveRecording, recorderState.durationMillis]);

  const finalDuration = recordingUri && /\.aac$/i.test(recordingUri)
    ? Math.min(recordedDuration, MAX_DURATION_MS)
    : recordedDuration;
  const currentDuration = hasActiveRecording
    ? Math.max(
        latestDurationRef.current,
        audioRecorder.getStatus().durationMillis
      )
    : finalDuration;

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1_000_000).toFixed(2)} MB`;
  };

  const resetPlayback = async () => {
    audioPlayer.pause();

    try {
      await audioPlayer.seekTo(0);
    } catch (err) {
      console.log('AUDIO SEEK ERROR:', err);
    }
  };

  const removeAudioFile = (uri: string) => {
    try {
      const file = new File(uri);

      if (file.exists) {
        file.delete();
      }
    } catch (err) {
      console.log('AUDIO FILE DELETE ERROR:', err);
    }
  };

  const clearPreview = () => {
    audioPlayer.pause();
    // Native Android pada build ini menolak replace(null). Player dijeda;
    // sumber baru dipasang hanya ketika URI rekaman/preview tersedia.
    if (previewUriRef.current) removeAudioFile(previewUriRef.current);
    previewUriRef.current = null;
    setPreviewUri(null);
  };

  // MULAI REKAMAN / REKAM ULANG
  const startRecording = async () => {
    if (
      processingRef.current ||
      submittingRef.current ||
      hasActiveRecording ||
      phaseRef.current === 'recording' ||
      phaseRef.current === 'paused'
    ) {
      return;
    }

    processingRef.current = true;
    setLoading(true);
    setError('');
    let preparedForAttempt = false;
    let startedForAttempt = false;

    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        setError(
          'Izin mikrofon diperlukan untuk merekam cerita. Silakan aktifkan izin mikrofon di pengaturan aplikasi.'
        );
        return;
      }

      await resetPlayback();

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      clearPreview();
      await audioRecorder.prepareToRecordAsync();
      preparedForAttempt = true;

      // Mulai native dahulu; jika gagal, file rekaman sebelumnya tetap tersedia.
      await audioRecorder.record();
      startedForAttempt = true;
      phaseRef.current = 'recording';
      setHasActiveRecording(true);
      setIsPaused(false);

      // Rekaman lama diganti hanya saat rekaman baru berhasil dimulai.
      if (recordingUri) {
        removeAudioFile(recordingUri);
      }

      setRecordingUri(null);
      setRecordedDuration(0);
      setFileSize(null);

      setWaveform(Array(31).fill(0.04));
      latestDurationRef.current = 0;
      stoppingRef.current = false;

      setHasActiveRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.log('AUDIO RECORD ERROR:', err);

      if (startedForAttempt) {
        // Jangan sembunyikan recorder yang sudah aktif jika langkah UI gagal.
        setHasActiveRecording(true);
        setIsPaused(false);
      } else {
        if (preparedForAttempt) {
          try { await audioRecorder.stop(); } catch { /* Izinkan percobaan ulang. */ }
        }
        setError('Rekaman belum dapat dimulai. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // JEDA REKAMAN
  const pauseRecording = async () => {
    if (
      processingRef.current ||
      submittingRef.current ||
      !hasActiveRecording ||
      isPaused ||
      phaseRef.current !== 'recording'
    ) {
      return;
    }

    processingRef.current = true;
    try {
      const status = audioRecorder.getStatus();
      if (!status.canRecord || !status.isRecording) return;
      latestDurationRef.current = Math.max(
        latestDurationRef.current,
        status.durationMillis
      );

      await audioRecorder.pause();
      phaseRef.current = 'paused';

      setIsPaused(true);
      setError('');
    } catch (err) {
      console.log('AUDIO PAUSE ERROR:', err);

      setError(
        'Gagal menjeda rekaman. Silakan coba lagi.'
      );
    } finally {
      processingRef.current = false;
    }
  };

  // LANJUTKAN REKAMAN YANG SAMA
  const resumeRecording = async () => {
    if (
      processingRef.current ||
      submittingRef.current ||
      !hasActiveRecording ||
      phaseRef.current !== 'paused'
    ) {
      return;
    }

    processingRef.current = true;
    try {
      const status = audioRecorder.getStatus();
      if (status.durationMillis >= MAX_DURATION_MS) {
        processingRef.current = false;
        await stopRecording(true, true);
        return;
      }
      if (!status.canRecord) {
        setError('Rekaman sudah berhenti. Gunakan Rekam Ulang untuk merekam kembali.');
        return;
      }
      if (status.isRecording) return;
      clearPreview();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      // Jangan prepare ulang: record() memanggil MediaRecorder.resume() saat paused.
      await audioRecorder.record();
      phaseRef.current = 'recording';

      setIsPaused(false);
      setError('');
    } catch (err) {
      console.log('AUDIO RESUME ERROR:', err);

      setError(
        'Gagal melanjutkan rekaman. Silakan coba lagi.'
      );
    } finally {
      processingRef.current = false;
    }
  };

  // Stop menjeda; file difinalisasi saat dikirim atau mencapai batas 10 menit.
  const stopRecording = async (
    forceFinish = false,
    reachedLimit = false
  ) => {
    if (
      processingRef.current ||
      stoppingRef.current ||
      submittingRef.current ||
      !hasActiveRecording ||
      phaseRef.current === 'finished' ||
      phaseRef.current === 'idle'
    ) {
      return;
    }

    const measuredDuration = Math.max(
      latestDurationRef.current,
      audioRecorder.getStatus().durationMillis
    );
    const duration = reachedLimit ? MAX_DURATION_MS : Math.min(measuredDuration, MAX_DURATION_MS);

    if (!forceFinish && measuredDuration < MAX_DURATION_MS) {
      if (phaseRef.current === 'recording') {
        await pauseRecording();
      }
      if (phaseRef.current === 'paused' && duration < MIN_DURATION_MS) {
        setError(
          'Rekaman dijeda. Minimal 3 menit. Tekan Lanjut untuk meneruskan ceritamu.'
        );
      }
      return;
    }

    processingRef.current = true;
    stoppingRef.current = true;
    setLoading(true);
    setError('');

    try {
      clearPreview();
      await audioRecorder.stop();
      phaseRef.current = 'finished';
      setHasActiveRecording(false);
      setIsPaused(false);

      const uri = audioRecorder.uri;

      if (!uri) {
        throw new Error('File rekaman tidak ditemukan.');
      }

      const file = new File(uri);

      if (!file.exists) {
        throw new Error('File rekaman tidak tersedia.');
      }

      const size = file.size;

      setRecordingUri(uri);
      setRecordedDuration(duration);
      setFileSize(size);

      setHasActiveRecording(false);
      setIsPaused(false);

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      audioPlayer.replace({ uri });

      if (size <= 0) {
        setError('File rekaman kosong. Silakan rekam ulang.');
      } else if (size > MAX_FILE_SIZE) {
        setError(
          'Ukuran rekaman melebihi 15 MB. Silakan rekam ulang.'
        );
      }
      return { uri, duration, size };
    } catch (err) {
      console.log('AUDIO STOP ERROR:', err);

      setError(
        'Gagal menyimpan rekaman. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
      processingRef.current = false;
      stoppingRef.current = false;
    }
  };

  // OTOMATIS SELESAI SAAT 10 MENIT
  useEffect(() => {
    if (
      hasActiveRecording &&
      isRecording &&
      !stoppingRef.current &&
      !processingRef.current
    ) {
      // Jadwalkan sisa waktu, jangan menunggu polling berikutnya melewati 10:00.
      // Timer dibersihkan saat pause; durasi jeda tidak dihitung sebagai audio.
      const remaining = MAX_DURATION_MS - audioRecorder.getStatus().durationMillis;
      if (remaining <= 0) {
        void stopRecording(true, true);
        return;
      }
      const timer = setTimeout(() => void stopRecording(true, true), remaining);
      return () => clearTimeout(timer);
    }
  }, [hasActiveRecording, isRecording, currentDuration]);

  // TOMBOL UTAMA PEREKAMAN
  const handleRecordButton = async () => {
    if (
      processingRef.current ||
      submittingRef.current ||
      loading
    ) {
      return;
    }

    // Pulihkan tampilan jika build sebelumnya gagal setelah native mulai merekam.
    if (!hasActiveRecording &&
        (phaseRef.current === 'recording' || phaseRef.current === 'paused')) {
      const status = audioRecorder.getStatus();
      if (status.canRecord) {
        phaseRef.current = status.isRecording ? 'recording' : 'paused';
        setHasActiveRecording(true);
        setIsPaused(!status.isRecording);
        setError('');
        return;
      }
      phaseRef.current = 'idle';
    }

    if (phaseRef.current === 'paused') {
      await resumeRecording();
    } else if (phaseRef.current === 'recording') {
      await pauseRecording();
    } else {
      await startRecording();
    }
  };

  // PUTAR / JEDA AUDIO
  const handlePlayback = async () => {
    if (
      (!recordingUri && !(hasActiveRecording && isPaused && currentDuration >= MIN_DURATION_MS)) ||
      (hasActiveRecording && !isPaused) ||
      loading ||
      processingRef.current ||
      submittingRef.current
    ) {
      return;
    }

    setError('');
    processingRef.current = true;

    try {
      let sourceUri = recordingUri;
      if (hasActiveRecording && isPaused) {
        sourceUri = previewUriRef.current;
        if (!sourceUri) {
          const originalUri = audioRecorder.uri;
          if (!originalUri || !/\.aac$/i.test(originalUri)) {
            throw new Error('Preview rekaman yang masih bisa dilanjutkan belum tersedia pada format ini.');
          }
          setLoading(true);
          const snapshot = new File(Paths.cache, `curhat-preview-${Date.now()}.aac`);
          try {
            await new File(originalUri).copy(snapshot);
          } catch (error) {
            removeAudioFile(snapshot.uri);
            throw error;
          }
          sourceUri = snapshot.uri;
          previewUriRef.current = sourceUri;
          setPreviewUri(sourceUri);
          audioPlayer.replace({ uri: sourceUri });
        }
      }
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      if (isPlaying) {
        audioPlayer.pause();
        return;
      }

      if (
        playerStatus.didJustFinish ||
        (playerStatus.duration > 0 &&
          playerStatus.currentTime >=
            playerStatus.duration - 0.1)
      ) {
        await audioPlayer.seekTo(0);
      }

      audioPlayer.play();
    } catch (err) {
      console.log('AUDIO PLAYBACK ERROR:', err);

      setError(
        'Rekaman gagal diputar. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // HAPUS REKAMAN, TERMASUK SAAT DIJEDA
  const handleDeleteRecording = async () => {
    if (
      processingRef.current ||
      submittingRef.current ||
      loading
    ) {
      return;
    }

    if (hasActiveRecording && !isPaused) {
      setError(
        'Jeda rekaman terlebih dahulu sebelum menghapusnya.'
      );
      return;
    }

    if (!hasActiveRecording && !recordingUri) {
      return;
    }

    processingRef.current = true;
    setLoading(true);
    setError('');

    try {
      clearPreview();
      if (hasActiveRecording && isPaused) {
        await audioRecorder.stop();
        phaseRef.current = 'idle';
        setHasActiveRecording(false);
        setIsPaused(false);

        const temporaryUri = audioRecorder.uri;

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });

        if (temporaryUri) {
          removeAudioFile(temporaryUri);
        }

        setHasActiveRecording(false);
        setIsPaused(false);
      } else if (recordingUri) {
        await resetPlayback();

        removeAudioFile(recordingUri);
      }

      setRecordingUri(null);
      setRecordedDuration(0);
      setFileSize(null);

      latestDurationRef.current = 0;
      stoppingRef.current = false;
      phaseRef.current = 'idle';
      setWaveform(Array(31).fill(0.04));
    } catch (err) {
      console.log('AUDIO DELETE ERROR:', err);

      setError(
        'Gagal menghapus rekaman. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // KONFIRMASI HAPUS
  const confirmDeleteRecording = () => {
    if (loading || processingRef.current || submittingRef.current) {
      return;
    }

    setDeleteConfirmationVisible(true);
  };

  // VALIDASI DAN UPLOAD AUDIO KE BACKEND
  const handleSubmit = async () => {
    if (
      submittingRef.current ||
      processingRef.current ||
      loading
    ) {
      return;
    }

    setError('');

    let uploadUri = recordingUri;
    let uploadDuration = finalDuration;
    let uploadSize = fileSize;

    if (hasActiveRecording) {
      if (phaseRef.current !== 'paused') {
        setError('Tekan Stop atau Jeda terlebih dahulu sebelum mengirim.');
        return;
      }
      if (audioRecorder.getStatus().durationMillis < MIN_DURATION_MS) {
        setError('Rekaman minimal 3 menit. Tekan Lanjut untuk meneruskan ceritamu.');
        return;
      }
      // Gunakan hasil finalisasi langsung, tanpa menunggu pembaruan state React.
      const completed = await stopRecording(true);
      if (!completed) return;
      uploadUri = completed.uri;
      uploadDuration = completed.duration;
      uploadSize = completed.size;
    }

    if (!uploadUri) {
      setError('Rekam ceritamu terlebih dahulu.');
      return;
    }

    if (uploadDuration < MIN_DURATION_MS) {
      setError(
        'Rekaman minimal 3 menit sebelum dapat dikirim.'
      );
      return;
    }

    if (uploadDuration > MAX_DURATION_MS) {
      setError(
        'Durasi rekaman maksimal 10 menit.'
      );
      return;
    }

    if (uploadSize === null) {
      setError(
        'Ukuran rekaman belum dapat diperiksa. Silakan rekam ulang.'
      );
      return;
    }

    if (uploadSize > MAX_FILE_SIZE) {
      setError(
        'Ukuran rekaman melebihi 15 MB. Silakan rekam ulang.'
      );
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setLoading(true);

    try {
      // MENGAMBIL TOKEN LOGIN
      const accessToken = await getAccessToken();

      if (!accessToken) {
        await clearSession();

        router.replace({
          pathname: '/login',
          params: {
            notice:
              'Sesi kamu telah berakhir. Silakan masuk kembali.',
          },
        });

        return;
      }

      // HENTIKAN PLAYBACK SEBELUM UPLOAD
      audioPlayer.pause();

      // PASTIKAN FILE MASIH TERSEDIA
      const audioFile = new File(uploadUri);

      if (!audioFile.exists) {
        setError(
          'File rekaman tidak ditemukan. Silakan rekam ulang.'
        );
        return;
      }

      const actualFileSize = audioFile.size;

      if (actualFileSize <= 0) {
        setError('File rekaman kosong. Silakan rekam ulang.');
        return;
      }

      if (actualFileSize > MAX_FILE_SIZE) {
        setFileSize(actualFileSize);

        setError(
          'Ukuran rekaman melebihi 15 MB. Silakan rekam ulang.'
        );
        return;
      }

      // KIRIM AUDIO KE BACKEND
      // Tanpa batas timeout buatan.
      const response = await sendAudioCurhat(
        uploadUri,
        accessToken
      );

      const result = response?.data ?? response;

      // PASTIKAN HASIL ANALISIS ADA
      if (
        !result ||
        typeof result !== 'object' ||
        !['emosi', 'ringkasan_cerita', 'akar_masalah', 'rekomendasi', 'waktu'].every(
          (field) => typeof result[field] === 'string' && result[field].trim().length > 0
        )
      ) {
        setError(
          'Rekaman telah diterima, tetapi hasil analisis belum tersedia. Silakan periksa kembali.'
        );
        return;
      }

      // NAVIGASI KE HALAMAN HASIL ANALISIS
      router.push({
        pathname: '/hasil',
        params: {
          teks: String(
            result.teks ??
            result.transkripsi ??
            result.transkrip ??
            ''
          ),
          emosi: String(result.emosi ?? ''),
          ringkasan_cerita: String(
            result.ringkasan_cerita ?? ''
          ),
          akar_masalah: String(
            result.akar_masalah ?? ''
          ),
          rekomendasi: String(
            result.rekomendasi ?? ''
          ),
          waktu: String(result.waktu ?? ''),
        },
      });
    } catch (err: any) {
      // SESI LOGIN KEDALUWARSA
      if (err?.status === 401) {
        await clearSession();

        router.replace({
          pathname: '/login',
          params: {
            notice:
              'Sesi kamu telah berakhir. Silakan masuk kembali.',
          },
        });

        return;
      }

      const message =
        err instanceof Error ? err.message : '';

      const isConnectionError =
        /fetch failed|network request failed|failed to fetch|network error|unexpected end of stream/i.test(
          message
        );

      if (isConnectionError) {
        setError(
          'Gagal terhubung ke server. Periksa koneksi dan coba lagi.'
        );
      } else if (err?.status === 400) {
        setError(formatAudioWarning(message));
      } else if (err?.status === 413) {
        setError(
          'Ukuran file terlalu besar untuk dikirim. Maksimal 15 MB.'
        );
      } else if (err?.status === 429) {
        setError(
          'Layanan analisis sedang menerima terlalu banyak permintaan. Silakan coba lagi beberapa saat.'
        );
      } else if (err?.status === 500) {
        setError(
          'Ada kendala saat memproses rekamanmu. Silakan coba lagi nanti.'
        );
      } else if (
        err?.status === 502 ||
        err?.status === 503 ||
        err?.status === 504
      ) {
        setError(
          'Layanan analisis sedang mengalami gangguan. Silakan coba lagi nanti.'
        );
      } else {
        setError(
          message ||
          'Gagal mengirim rekaman. Silakan coba lagi.'
        );
      }

      // FILE REKAMAN TETAP ADA JIKA UPLOAD GAGAL.
      // PENGGUNA BISA MENCOBA MENGIRIM ULANG.
    } finally {
      setLoading(false);
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleBack = () => {
    if (
      !hasActiveRecording &&
      !loading &&
      !submittingRef.current
    ) {
      audioPlayer.pause();
      router.back();
    }
  };

  const canSendPausedRecording = hasActiveRecording && isPaused &&
    currentDuration >= MIN_DURATION_MS && currentDuration <= MAX_DURATION_MS;

  const isValidRecording = canSendPausedRecording || (
    !hasActiveRecording &&
    recordingUri !== null &&
    finalDuration >= MIN_DURATION_MS &&
    finalDuration <= MAX_DURATION_MS &&
    fileSize !== null &&
    fileSize > 0 &&
    fileSize <= MAX_FILE_SIZE);

  const playbackPositionMs = Math.floor(
    playerStatus.currentTime * 1000
  );

  const playbackProgress =
    currentDuration > 0
      ? Math.min(
          100,
          (playbackPositionMs / currentDuration) * 100
        )
      : 0;

  const hasFinishedRecording = recordingUri !== null && !hasActiveRecording;
  const canListenWhilePaused = hasActiveRecording && isPaused && currentDuration >= MIN_DURATION_MS;
  const canCancel = !loading && (!hasActiveRecording || isPaused);
  const statusLabel = hasActiveRecording
    ? isPaused ? 'Rekaman dijeda' : 'Sedang merekam'
    : hasFinishedRecording
      ? recordedDuration >= MAX_DURATION_MS
        ? 'Batas 10 menit tercapai. Silakan kirim rekaman.'
        : 'Rekaman siap dikirim'
      : 'Siap mendengarkan ceritamu';

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          disabled={loading || hasActiveRecording}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={25} color="#3F384A" />
        </Pressable>
        <Text style={styles.title}>Curhat Suara</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.recordingGuide}>
        <Ionicons name="mic-outline" size={22} color="#9B73BB" />
        <View style={styles.recordingGuideContent}>
          <Text style={styles.recordingGuideText}>
            Ceritakan pengalaman atau perasaanmu sendiri dengan suara yang jelas.
            Pilih tempat tenang, hindari keramaian, musik, dan suara latar.
          </Text>
        </View>
      </View>

      <View style={styles.recorderArea}>
        <View style={styles.timerRow}>
          <View style={[
            styles.recordingDot,
            (!hasActiveRecording || isPaused) && styles.inactiveDot,
          ]} />
          <Text style={styles.durationText}>
            {formatDuration(isPlaying ? playbackPositionMs : currentDuration)}
          </Text>
        </View>
        <Text style={styles.statusText}>{statusLabel}</Text>

        <View style={styles.waveformArea} accessibilityLabel="Gelombang tingkat suara rekaman">
          <View style={styles.waveform}>
            {waveform.map((amplitude, index) => (
              <View
                key={index}
                style={[
                  styles.waveBar,
                  { height: 4 + amplitude * 105 },
                  (!hasActiveRecording && !hasFinishedRecording) && styles.idleWaveBar,
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.durationHint}>Minimal 03:00 · Maksimal 10:00 · 15 MB</Text>

        <View style={styles.controls}>
          <View style={styles.controlItem}>
            <Pressable
              style={[styles.controlButton, !canCancel && styles.disabledButton]}
              onPress={hasActiveRecording || recordingUri ? confirmDeleteRecording : handleBack}
              disabled={!canCancel}
              accessibilityLabel={hasActiveRecording || recordingUri ? 'Hapus rekaman dengan konfirmasi' : 'Batal'}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={25} color="#7D7987" />
            </Pressable>
            <Text style={styles.controlLabel}>Batal</Text>
          </View>

          <View style={styles.controlItem}>
            <Pressable
              style={[styles.mainControl, loading && styles.disabledButton]}
              onPress={canListenWhilePaused
                ? handlePlayback : hasActiveRecording
                ? () => void stopRecording()
                : hasFinishedRecording ? handlePlayback : handleRecordButton}
              disabled={loading}
              accessibilityLabel={canListenWhilePaused ? isPlaying ? 'Jeda playback' : 'Putar rekaman' : hasActiveRecording ? 'Selesai rekam' : hasFinishedRecording
                ? isPlaying ? 'Jeda playback' : 'Putar rekaman' : 'Mulai rekam'}
              accessibilityRole="button"
            >
              <Ionicons
                name={canListenWhilePaused ? isPlaying ? 'pause' : 'play' : hasActiveRecording ? 'stop' : hasFinishedRecording
                  ? isPlaying ? 'pause' : 'play' : 'mic'}
                size={29}
                color="#FFFFFF"
              />
            </Pressable>
            <Text style={[styles.controlLabel, styles.mainControlLabel]}>
              {canListenWhilePaused ? isPlaying ? 'Jeda' : 'Putar' : hasActiveRecording ? 'Stop' : hasFinishedRecording
                ? isPlaying ? 'Jeda' : 'Putar' : 'Mulai'}
            </Text>
          </View>

          <View style={styles.controlItem}>
            {!hasFinishedRecording && (
              <>
            <Pressable
              style={[
                styles.controlButton,
                (loading || !hasActiveRecording) && styles.disabledButton,
              ]}
              onPress={handleRecordButton}
              disabled={loading || !hasActiveRecording}
              accessibilityLabel={isPaused ? 'Lanjutkan rekaman' : 'Jeda rekaman'}
              accessibilityRole="button"
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={23}
                color="#7D7987"
              />
            </Pressable>
            <Text style={styles.controlLabel}>
              {isPaused ? 'Lanjut' : 'Jeda'}
            </Text>
              </>
            )}
          </View>
        </View>

        {(hasFinishedRecording || (canListenWhilePaused && previewUri)) && (
          <View style={styles.previewInfo}>
            <View style={styles.playbackTimeRow}>
              <Text style={styles.playbackTime}>{formatDuration(playbackPositionMs)}</Text>
              <Text style={styles.playbackTime}>{formatDuration(currentDuration)}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${playbackProgress}%` }]} />
            </View>
            {fileSize !== null && (
              <Text style={styles.fileSizeText}>Ukuran rekaman: {formatFileSize(fileSize)} / 15 MB</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {error !== '' && <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#9F72D3" />
            <Text style={styles.loadingText}>
              {submitting ? 'Sedang menganalisis rekamanmu...' : 'Sedang memproses rekaman...'}
            </Text>
          </View>
        )}
        <Pressable
          style={[styles.primaryButton, (loading || !isValidRecording) && styles.disabledButton]}
          onPress={() => void handleSubmit()}
          disabled={loading || (hasActiveRecording && !isPaused)}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Kirim Rekaman</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, (loading || hasActiveRecording || !recordingUri) && styles.disabledButton]}
          onPress={handleRecordButton}
          disabled={loading || hasActiveRecording || !recordingUri}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Rekam Ulang</Text>
        </Pressable>
      </View>
    </ScrollView>
    <Modal
      visible={deleteConfirmationVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setDeleteConfirmationVisible(false)}
    >
      <View style={styles.confirmationOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setDeleteConfirmationVisible(false)}
          accessibilityLabel="Tutup konfirmasi hapus"
          accessibilityRole="button"
        />
        <View style={styles.confirmationCard} accessibilityViewIsModal>
          <View style={styles.confirmationIcon}>
            <Ionicons name="trash-outline" size={28} color="#AB6B98" />
          </View>
          <Text style={styles.confirmationTitle} accessibilityRole="header">Hapus rekaman?</Text>
          <Text style={styles.confirmationDescription}>
            Cerita yang sudah direkam akan dihapus dan tidak bisa dikembalikan.
          </Text>
          <View style={styles.confirmationActions}>
            <Pressable
              style={styles.confirmationCancel}
              onPress={() => setDeleteConfirmationVisible(false)}
              accessibilityRole="button"
            >
              <Text style={styles.confirmationCancelText}>Batal</Text>
            </Pressable>
            <Pressable
              style={styles.confirmationDelete}
              disabled={loading}
              onPress={() => {
                setDeleteConfirmationVisible(false);
                void handleDeleteRecording();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.confirmationDeleteText}>Hapus</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFAFE' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', height: 48 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerSpacer: { width: 44 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#352F3F' },
  recordingGuide: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: '#EADDF3', backgroundColor: '#F4EDF9' },
  recordingGuideContent: { flex: 1 },
  recordingGuideTitle: { fontSize: 13, fontWeight: '700', color: '#7F5B9E', marginBottom: 6 },
  recordingGuideText: { fontSize: 12, lineHeight: 19, color: '#93819F' },
  recorderArea: { flex: 1, alignItems: 'center', paddingTop: 48, paddingBottom: 28 },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  recordingDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#F6537D' },
  inactiveDot: { backgroundColor: '#C7B1DE' },
  durationText: { fontSize: 24, fontWeight: '700', color: '#B65A75', fontVariant: ['tabular-nums'] },
  statusText: { fontSize: 12, color: '#9A8EA7', marginTop: 10 },
  waveformArea: { flex: 1, minHeight: 180, width: '100%', justifyContent: 'center', paddingVertical: 32 },
  waveform: { height: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  waveBar: { width: 4, borderRadius: 3, backgroundColor: '#D89CE5' },
  idleWaveBar: { backgroundColor: '#E8D4F0' },
  durationHint: { fontSize: 11, color: '#A399AF', textAlign: 'center', marginBottom: 28 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 300 },
  controlItem: { alignItems: 'center', width: 76 },
  controlButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#EEEBF2', justifyContent: 'center', alignItems: 'center' },
  mainControl: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#F6537D', justifyContent: 'center', alignItems: 'center' },
  controlLabel: { fontSize: 12, color: '#716A7D', fontWeight: '600', marginTop: 10 },
  mainControlLabel: { color: '#53485F' },
  previewInfo: { width: '100%', marginTop: 26 },
  playbackTimeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  playbackTime: { fontSize: 11, color: '#A399AF' },
  progressTrack: { height: 4, borderRadius: 3, backgroundColor: '#EEE6F5', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#B184D7' },
  fileSizeText: { fontSize: 11, textAlign: 'center', color: '#A399AF', marginTop: 12 },
  actions: { width: '100%', paddingTop: 12 },
  primaryButton: { height: 52, borderRadius: 13, backgroundColor: '#A674D4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  secondaryButton: { height: 50, borderRadius: 13, borderWidth: 1.5, borderColor: '#D5C0E8', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: '#9264BC' },
  disabledButton: { opacity: 0.45 },
  errorText: { fontSize: 13, color: '#C55F76', lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 },
  loadingText: { flexShrink: 1, fontSize: 12, color: '#8C789F', lineHeight: 19 },
  confirmationOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: 'rgba(53, 38, 68, 0.35)' },
  confirmationCard: { width: '100%', maxWidth: 360, padding: 26, borderRadius: 26, borderWidth: 1, borderColor: '#EEE3F5', backgroundColor: '#FFFCFF', alignItems: 'center', elevation: 8, shadowColor: '#5F3B78', shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 8 } },
  confirmationIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F7EAF4', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  confirmationTitle: { fontSize: 20, fontWeight: '700', color: '#51405F', textAlign: 'center', marginBottom: 10 },
  confirmationDescription: { fontSize: 14, lineHeight: 22, color: '#918099', textAlign: 'center', marginBottom: 24 },
  confirmationActions: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmationCancel: { flex: 1, minHeight: 48, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: '#DDCBEA', backgroundColor: '#FAF5FD', alignItems: 'center', justifyContent: 'center' },
  confirmationCancelText: { fontSize: 14, fontWeight: '600', color: '#946AB1' },
  confirmationDelete: { flex: 1, minHeight: 48, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, backgroundColor: '#A674D4', alignItems: 'center', justifyContent: 'center' },
  confirmationDeleteText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
