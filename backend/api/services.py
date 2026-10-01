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

    text = text.strip()

    # Jika Gemini masih memberi markdown ```json
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        raise ValueError(
            "Output Gemini tidak memiliki format JSON yang valid."
        )


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
- Tetap pahami bahasa Indonesia tidak baku, bahasa gaul,
  singkatan, maupun typo.
- Berikan respons empatik dan tidak menghakimi.

Kategori emosi yang diperbolehkan:
- Cemas
- Sedih
- Takut
- Marah
- Tertekan
- Kesepian
- Netral

Kembalikan HANYA JSON valid dengan format:

{{
    "emosi": "kategori emosi utama",
    "akar_masalah": "ringkasan penyebab atau masalah utama berdasarkan cerita pengguna",
    "rekomendasi": "rekomendasi awal yang empatik dan suportif"
}}
"""

    response = generate_with_retry(prompt)

    return parse_json_response(response.text)


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
Periksa apakah audio berisi manusia yang sedang berbicara/curhat.

Jika file hanya berisi lagu, musik, instrumen, atau nyanyian,
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
- Gunakan bahasa yang empatik dan tidak menghakimi.

Kategori emosi:
- Cemas
- Sedih
- Takut
- Marah
- Tertekan
- Kesepian
- Netral

Kembalikan HANYA JSON valid:

{
    "valid": true,
    "emosi": "kategori emosi utama",
    "akar_masalah": "ringkasan masalah utama berdasarkan isi audio",
    "rekomendasi": "rekomendasi awal yang empatik dan suportif"
}
"""

    response = generate_with_retry(
        [
            audio_part,
            prompt
        ]
    )

    return parse_json_response(response.text)