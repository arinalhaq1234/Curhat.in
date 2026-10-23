
import { API_URL } from "@/constants/api";
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    let message = "Terjadi kesalahan pada request.";

    if (data.errors?.username) {
      message = "Username sudah digunakan.";
    } else if (data.errors?.email) {
      message = "Email sudah digunakan atau tidak valid.";
    } else if (data.detail) {
      message = data.detail;
    } else if (data.message) {
      message = data.message;
    }

    throw new ApiError(
      message,
      response.status
    );
  }

  return data;
}

export async function checkHealth() {
  return apiRequest("/api/health/");
}

export async function registerUser(
  username: string,
  email: string,
  password: string
) {
  return apiRequest("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });
}

export async function loginUser(
  username: string,
  password: string
) {
  return apiRequest("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function getProfile(accessToken: string) {
  return apiRequest("/api/auth/profile/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// LOGOUT - Mengirim refresh token dan Bearer access token
export async function logoutUser(
  refreshToken: string,
  accessToken: string
) {
  return apiRequest("/api/auth/logout/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });
}

export async function sendTextCurhat(
  teks: string,
  accessToken: string
) {
  return apiRequest('/api/curhat/text/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ teks }),
  });
}

// Remux AAC ADTS Android menjadi M4A tanpa decoding/re-encoding atau Base64.
// Sample AAC tetap utuh; tabel MP4 dibuat dari panjang tiap frame ADTS.
export function packageAacAsM4a(input: Uint8Array): Uint8Array {
  const frequencies = [96000, 88200, 64000, 48000, 44100, 32000, 24000,
    22050, 16000, 12000, 11025, 8000, 7350];
  const frames: Uint8Array[] = [];
  let frequencyIndex = -1, channels = 0, objectType = 0;
  for (let offset = 0; offset < input.length;) {
    if (offset + 7 > input.length || input[offset] !== 0xff ||
        (input[offset + 1] & 0xf6) !== 0xf0) {
      throw new Error('Data rekaman AAC tidak lengkap atau tidak valid.');
    }
    const headerSize = (input[offset + 1] & 1) ? 7 : 9;
    const frameSize = ((input[offset + 3] & 3) << 11) |
      (input[offset + 4] << 3) | (input[offset + 5] >> 5);
    const index = (input[offset + 2] >> 2) & 15;
    const count = ((input[offset + 2] & 1) << 2) | (input[offset + 3] >> 6);
    const profile = (input[offset + 2] >> 6) + 1;
    if (frameSize <= headerSize || offset + frameSize > input.length ||
        (input[offset + 6] & 3) !== 0 || !frequencies[index] ||
        frequencies[index] > 65535 || count < 1 || count > 2 ||
        (frequencyIndex !== -1 &&
          (index !== frequencyIndex || count !== channels || profile !== objectType))) {
      throw new Error('Format bagian rekaman AAC tidak sesuai. Rekaman asli tetap tersimpan.');
    }
    frequencyIndex = index; channels = count; objectType = profile;
    frames.push(input.subarray(offset + headerSize, offset + frameSize));
    offset += frameSize;
  }
  if (!frames.length) throw new Error('File rekaman kosong.');

  const join = (...parts: Uint8Array[]) => {
    const output = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
    let offset = 0;
    for (const part of parts) { output.set(part, offset); offset += part.length; }
    return output;
  };
  const words = (...values: number[]) => {
    const bytes = new Uint8Array(values.length * 4);
    const view = new DataView(bytes.buffer);
    values.forEach((value, index) => view.setUint32(index * 4, value));
    return bytes;
  };
  const ascii = (value: string) => Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0)));
  const atom = (name: string, ...parts: Uint8Array[]) =>
    join(words(8 + parts.reduce((size, part) => size + part.length, 0)), ascii(name), ...parts);
  const full = (name: string, ...parts: Uint8Array[]) => atom(name, words(0), ...parts);
  const descriptor = (tag: number, payload: Uint8Array) => {
    const length = [payload.length & 127];
    for (let remaining = payload.length >>> 7; remaining; remaining >>>= 7) {
      length.unshift((remaining & 127) | 128);
    }
    return join(Uint8Array.from([tag, ...length]), payload);
  };
  const rate = frequencies[frequencyIndex];
  // Timer/encoder dapat melewati batas beberapa frame. Kirim hanya frame utuh
  // dalam 600 detik; file AAC asli tetap utuh untuk playback dan retry.
  frames.length = Math.min(frames.length, Math.floor(600 * rate / 1024));
  const mediaDuration = frames.length * 1024;
  const movieDuration = Math.ceil(mediaDuration * 1000 / rate);
  const matrix = words(65536, 0, 0, 0, 65536, 0, 0, 0, 0x40000000);
  const config = Uint8Array.of((objectType << 3) | (frequencyIndex >> 1),
    ((frequencyIndex & 1) << 7) | (channels << 3));
  const esds = full('esds', descriptor(3, join(Uint8Array.of(0, 1, 0),
    descriptor(4, join(Uint8Array.of(0x40, 0x15, 0, 0, 0), words(128000, 128000),
      descriptor(5, config))), descriptor(6, Uint8Array.of(2)))));
  const sampleEntry = atom('mp4a', Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 1),
    new Uint8Array(8), Uint8Array.of(0, channels, 0, 16, 0, 0, 0, 0),
    words(rate * 65536), esds);
  const ftyp = atom('ftyp', ascii('M4A '), words(0), ascii('M4A isommp42'));
  // Satu chunk berisi seluruh sample, berurutan, tanpa header ADTS.
  const sizes = new Uint8Array(frames.length * 4);
  const sizesView = new DataView(sizes.buffer);
  frames.forEach((frame, index) => sizesView.setUint32(index * 4, frame.length));
  const stbl = atom('stbl', full('stsd', words(1), sampleEntry),
    full('stts', words(1, frames.length, 1024)),
    full('stsc', words(1, 1, frames.length, 1)),
    full('stsz', words(0, frames.length), sizes),
    full('stco', words(1, ftyp.length + 8)));
  const dinf = atom('dinf', full('dref', words(1), atom('url ', words(1))));
  const minf = atom('minf', full('smhd', words(0)), dinf, stbl);
  const mdia = atom('mdia', full('mdhd', words(0, 0, rate, mediaDuration),
    Uint8Array.of(0x55, 0xc4, 0, 0)),
    full('hdlr', words(0), ascii('soun'), new Uint8Array(12), ascii('Curhat.in Audio\0')), minf);
  const tkhd = atom('tkhd', words(7, 0, 0, 1, 0, movieDuration), new Uint8Array(8),
    Uint8Array.of(0, 0, 0, 0, 1, 0, 0, 0), matrix, words(0, 0));
  const mvhd = full('mvhd', words(0, 0, 1000, movieDuration, 65536),
    Uint8Array.of(1, 0, 0, 0), new Uint8Array(8), matrix, new Uint8Array(24), words(2));
  // Hindari spread ribuan frame pada pemanggilan fungsi (batas argumen JS).
  const payload = new Uint8Array(frames.reduce((size, frame) => size + frame.length, 0));
  let position = 0;
  for (const frame of frames) { payload.set(frame, position); position += frame.length; }
  return join(ftyp, atom('mdat', payload), atom('moov', mvhd, atom('trak', tkhd, mdia)));
}


export async function sendAudioCurhat(
  audioUri: string,
  accessToken: string
) {
  if (!API_URL) {
    throw new Error('Alamat backend belum dikonfigurasi.');
  }

  const file = new File(audioUri);
  if (!file.exists || file.size <= 0) {
    throw new Error('File rekaman kosong atau tidak ditemukan. Silakan rekam ulang.');
  }
  if (file.size > 15_000_000) {
    throw new Error('Ukuran rekaman maksimal 15 MB.');
  }
  if (!/\.(m4a|aac)$/i.test(file.name)) {
    throw new Error('Format rekaman tidak didukung. Rekam ulang dalam format M4A.');
  }
  const formData = new FormData();
  const packagedAudio = /\.aac$/i.test(file.name)
    ? packageAacAsM4a(await file.bytes())
    : null;
  if (packagedAudio && packagedAudio.length > 15_000_000) {
    throw new Error('Ukuran rekaman maksimal 15 MB.');
  }

  // Encoder Expo SDK 57 menerima bagian file melalui bytes().
  // Jangan memakai File.slice(): metode itu membuat Blob dari Uint8Array,
  // yang belum didukung Blob React Native pada sebagian runtime Android.
  const audioPart = {
    name: `curhat-${Date.now()}.m4a`,
    type: 'audio/mp4',
    bytes: () => packagedAudio ? Promise.resolve(packagedAudio) : file.bytes(),
  };
  formData.append(
    'audio',
    // FormData bertipe Blob, tetapi encoder native juga mendukung interface bytes().
    audioPart as unknown as Blob
  );

  const response = await expoFetch(
    `${API_URL}/api/curhat/audio/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  const responseText = await response.text();

  let data: any = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        throw new ApiError(
          'Server tidak dapat memproses rekaman saat ini.',
          response.status
        );
      }

      throw new Error(
        'Respons analisis dari server tidak valid.'
      );
    }
  }

  if (!response.ok) {
    let message = 'Gagal mengirim rekaman suara.';

    if (typeof data?.detail === 'string') {
      message = data.detail;
    } else if (typeof data?.message === 'string') {
      message = data.message;
    } else if (Array.isArray(data?.audio)) {
      message = data.audio.join(' ');
    } else if (Array.isArray(data?.errors?.audio)) {
      message = data.errors.audio.join(' ');
    }

    throw new ApiError(message, response.status);
  }

  if (data?.success === false) {
    throw new ApiError(
      typeof data.message === 'string' ? data.message : 'Analisis rekaman belum berhasil.',
      response.status
    );
  }

  return data;
}

// Mengambil daftar riwayat curhat pengguna yang sedang login
export async function getCurhatHistory(
  accessToken: string,
  page = 1
) {
  return apiRequest(`/api/curhat/history/?page=${page}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// Mengambil detail riwayat berdasarkan ID curhat
export async function getCurhatHistoryDetail(
  curhatId: number,
  accessToken: string
) {
  return apiRequest(`/api/curhat/history/${curhatId}/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}