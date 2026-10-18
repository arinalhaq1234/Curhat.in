import os
import json
import time

from google import genai
from google.genai import types


# =========================================================
# KONFIGURASI GEMINI
# =========================================================

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY tidak ditemukan di environment."
    )

client = genai.Client(api_key=API_KEY)

MODEL_NAME = "gemini-3.6-flash"


# =========================================================
# KONSTANTA HASIL ANALISIS
# =========================================================

KATEGORI_EMOSI = {
    "cemas": "Cemas",
    "sedih": "Sedih",
    "takut": "Takut",
    "marah": "Marah",
    "tertekan": "Tertekan",
    "kesepian": "Kesepian",
    "netral": "Netral",
}


# =========================================================
# FUNGSI REQUEST GEMINI + RETRY
# =========================================================

def generate_with_retry(contents, maksimal_percobaan=3):
    """
    Mengirim request ke Gemini dan mencoba ulang
    jika terjadi rate limit (429) atau server sibuk (503).
    """

    waktu_tunggu = 5

    for percobaan in range(1, maksimal_percobaan + 1):

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=contents,
            )

            return response

        except Exception as e:
            pesan = str(e)

            # Rate limit
            if "429" in pesan or "RESOURCE_EXHAUSTED" in pesan:

                if percobaan < maksimal_percobaan:
                    print(
                        f"Gemini terkena rate limit. "
                        f"Mencoba lagi dalam {waktu_tunggu} detik..."
                    )

                    time.sleep(waktu_tunggu)
                    waktu_tunggu *= 2
                    continue

                raise RuntimeError(
                    "Batas penggunaan Gemini sedang tercapai. "
                    "Silakan coba kembali beberapa saat lagi."
                )

            # Server sedang sibuk
            elif "503" in pesan or "UNAVAILABLE" in pesan:

                if percobaan < maksimal_percobaan:
                    print(
                        f"Server Gemini sedang sibuk. "
                        f"Mencoba lagi dalam {waktu_tunggu} detik..."
                    )

                    time.sleep(waktu_tunggu)
                    waktu_tunggu *= 2
                    continue

                raise RuntimeError(
                    "Layanan Gemini sedang sibuk. "
                    "Silakan coba kembali beberapa saat lagi."
                )

            else:
                raise


# =========================================================
# MEMBERSIHKAN OUTPUT JSON GEMINI
# =========================================================

def parse_json_response(text):
    """
    Mengubah output Gemini menjadi dictionary Python.
    """

    if not text or not isinstance(text, str):
        raise ValueError(
            "Gemini tidak memberikan respons yang dapat diproses."
        )

    text = text.strip()

    # Membersihkan markdown ```json ... ```
    if text.startswith("```"):
        baris = text.splitlines()

        if baris and baris[0].strip().startswith("```"):
            baris = baris[1:]

        if baris and baris[-1].strip() == "```":
            baris = baris[:-1]

        text = "\n".join(baris).strip()

    try:
        hasil = json.loads(text)

    except json.JSONDecodeError:
        raise ValueError(
            "Output Gemini tidak memiliki format JSON yang valid."
        )

    if not isinstance(hasil, dict):
        raise ValueError(
            "Output Gemini harus berupa objek JSON."
        )

    return hasil


# =========================================================
# VALIDASI HASIL ANALISIS AI
# =========================================================

def validasi_hasil_analisis(hasil, dari_audio=False):
    """
    Memastikan keluaran Gemini sesuai kontrak data Curhat.in.
    """

    if not isinstance(hasil, dict):
        raise ValueError(
            "Hasil analisis AI tidak memiliki struktur yang valid."
        )

    # Khusus audio: Gemini dapat menolak file yang bukan curhatan
    if dari_audio:
        valid = hasil.get("valid")

        if valid is False:
            pesan = hasil.get(
                "pesan",
                "File yang diberikan bukan rekaman curhatan."
            )

            return {
                "valid": False,
                "pesan": str(pesan).strip(),
            }

        if valid is not True:
            raise ValueError(
                "Status validasi audio dari Gemini tidak ditemukan."
            )

    field_wajib = [
        "emosi",
        "ringkasan_cerita",
        "akar_masalah",
        "rekomendasi",
    ]

    for field in field_wajib:
        nilai = hasil.get(field)

        if not isinstance(nilai, str) or not nilai.strip():
            raise ValueError(
                f"Field '{field}' pada hasil AI tidak valid atau kosong."
            )

    emosi = hasil["emosi"].strip().lower()

    if emosi not in KATEGORI_EMOSI:
        raise ValueError(
            "Kategori emosi dari AI tidak sesuai dengan kategori "
            "yang diperbolehkan."
        )

    hasil_valid = {
        "emosi": KATEGORI_EMOSI[emosi],
        "ringkasan_cerita": hasil["ringkasan_cerita"].strip(),
        "akar_masalah": hasil["akar_masalah"].strip(),
        "rekomendasi": hasil["rekomendasi"].strip(),
    }

    if dari_audio:
        hasil_valid["valid"] = True

    return hasil_valid


# =========================================================
# ANALISIS TEKS
# =========================================================

def analisis_teks(teks_curhat):
    """
    Menganalisis curhatan berbentuk teks.
    """

    prompt = f"""
Anda adalah AI pendamping emosional pada platform Curhat.in.

Analisis curhatan pengguna berikut:

"{teks_curhat}"

ATURAN:
- Jangan mengaku sebagai psikolog, dokter, atau tenaga kesehatan.
- Jangan memberikan diagnosis klinis.
- Analisis hanya berdasarkan cerita pengguna.
- Jangan mengarang informasi yang tidak disampaikan pengguna.
- Tetap pahami bahasa Indonesia tidak baku, bahasa gaul,
  singkatan, maupun typo.
- Gunakan bahasa Indonesia yang natural, empatik,
  suportif, dan tidak menghakimi.

Kategori emosi yang diperbolehkan:
- Cemas
- Sedih
- Takut
- Marah
- Tertekan
- Kesepian
- Netral

KETENTUAN HASIL:
- "emosi" berisi satu kategori emosi utama.
- "ringkasan_cerita" merangkum inti cerita pengguna
  secara singkat tanpa menambahkan informasi baru.
- "akar_masalah" menjelaskan masalah atau faktor utama
  yang terlihat dari cerita pengguna.
- "rekomendasi" diawali dengan respons yang empatik,
  kemudian berikan saran awal yang relevan, realistis,
  aman, dan sesuai dengan konteks cerita.

Kembalikan HANYA JSON valid dengan format:

{{
    "emosi": "kategori emosi utama",
    "ringkasan_cerita": "ringkasan singkat isi cerita pengguna",
    "akar_masalah": "masalah atau faktor utama berdasarkan cerita pengguna",
    "rekomendasi": "respons empatik dan rekomendasi yang relevan"
}}
"""

    response = generate_with_retry(prompt)

    hasil = parse_json_response(response.text)

    return validasi_hasil_analisis(
        hasil,
        dari_audio=False
    )


# =========================================================
# ANALISIS AUDIO
# =========================================================

def analisis_audio(audio_bytes, mime_type):
    """
    Menganalisis curhatan berbentuk audio menggunakan
    kemampuan multimodal Gemini.
    """

    audio_part = types.Part.from_bytes(
        data=audio_bytes,
        mime_type=mime_type
    )

    prompt = """
Anda adalah AI pendamping emosional pada platform Curhat.in.

Dengarkan dan pahami audio pengguna.

LANGKAH 1:
Periksa apakah audio berisi manusia yang sedang berbicara
atau menyampaikan sebuah cerita/curhatan.

Jika file hanya berisi lagu, musik, instrumen, suara tanpa
percakapan yang dapat dipahami, atau bukan rekaman curhatan,
kembalikan HANYA JSON:

{
    "valid": false,
    "pesan": "File yang diberikan bukan rekaman curhatan."
}

Jika audio berisi manusia yang sedang berbicara atau bercerita,
lanjutkan analisis.

ATURAN:
- Jangan mengaku sebagai psikolog, dokter, atau tenaga kesehatan.
- Jangan memberikan diagnosis klinis.
- Analisis hanya berdasarkan informasi dalam audio.
- Jangan mengarang informasi yang tidak terdapat dalam audio.
- Gunakan bahasa Indonesia yang natural, empatik,
  suportif, dan tidak menghakimi.

Kategori emosi yang diperbolehkan:
- Cemas
- Sedih
- Takut
- Marah
- Tertekan
- Kesepian
- Netral

KETENTUAN HASIL:
- "emosi" berisi satu kategori emosi utama.
- "ringkasan_cerita" merangkum inti cerita pengguna
  secara singkat tanpa menambahkan informasi baru.
- "akar_masalah" menjelaskan masalah atau faktor utama
  yang terlihat dari isi audio.
- "rekomendasi" diawali dengan respons yang empatik,
  kemudian berikan saran awal yang relevan, realistis,
  aman, dan sesuai dengan konteks cerita.

Kembalikan HANYA JSON valid:

{
    "valid": true,
    "emosi": "kategori emosi utama",
    "ringkasan_cerita": "ringkasan singkat isi cerita pengguna",
    "akar_masalah": "masalah atau faktor utama berdasarkan isi audio",
    "rekomendasi": "respons empatik dan rekomendasi yang relevan"
}
"""

    response = generate_with_retry(
        [
            audio_part,
            prompt
        ]
    )

    hasil = parse_json_response(response.text)

    return validasi_hasil_analisis(
        hasil,
        dari_audio=True
    )