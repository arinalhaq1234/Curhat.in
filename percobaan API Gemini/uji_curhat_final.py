"""Contoh AI-003 memakai fungsi produksi; --daftar tidak memanggil Gemini."""

import argparse
import json
import math
import sys
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4
from mutagen.wave import WAVE


PROJECT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from api.services import InputCurhatError, analisis_audio, analisis_teks  # noqa: E402


CONTOH_PATH = BACKEND_DIR / "api" / "examples" / "ai003_cases.json"
FORMAT_AUDIO = {
    ".mp3": ("audio/mpeg", MP3),
    ".m4a": ("audio/mp4", MP4),
    ".wav": ("audio/wav", WAVE),
}


def uji_analisis_teks(teks_curhat):
    return analisis_teks(teks_curhat)


def uji_analisis_audio(nama_file_audio):
    """Validasi file lokal sesuai batas BE-002 sebelum mengirim audio asli."""
    path = Path(nama_file_audio)
    if not path.is_file():
        raise InputCurhatError("File audio tidak ditemukan. Periksa path rekamanmu.")
    if path.suffix.lower() not in FORMAT_AUDIO:
        raise InputCurhatError("Format audio harus MP3, M4A, atau WAV.")
    if path.stat().st_size > 15_000_000:
        raise InputCurhatError("Ukuran audio maksimal 15 MB.")
    data = path.read_bytes()
    mime, parser = FORMAT_AUDIO[path.suffix.lower()]
    try:
        durasi = float(parser(BytesIO(data)).info.length)
    except Exception as error:
        raise InputCurhatError("File audio rusak atau tidak dapat dibaca.") from error
    if not math.isfinite(durasi) or durasi <= 0:
        raise InputCurhatError("Durasi audio tidak valid.")
    if durasi > 600:
        raise InputCurhatError("Durasi audio maksimal 10 menit.")
    return analisis_audio(data, mime)


def main():
    parser = argparse.ArgumentParser(
        description="Uji fungsi produksi AI-003 tanpa menyimpan data ke database."
    )
    pilihan = parser.add_mutually_exclusive_group(required=True)
    pilihan.add_argument("--daftar", action="store_true", help="Lihat bahan uji tanpa API key/kuota.")
    pilihan.add_argument("--kasus", help="Jalankan satu id contoh, misalnya cemas atau ambigu.")
    pilihan.add_argument("--teks", help="Kirim cerita teks ke Gemini.")
    pilihan.add_argument("--audio", type=Path, help="Kirim path file MP3/M4A/WAV ke Gemini.")
    args = parser.parse_args()

    contoh = json.loads(CONTOH_PATH.read_text(encoding="utf-8"))
    if args.daftar:
        print(json.dumps(contoh, ensure_ascii=False, indent=2))
        return 0

    if args.kasus:
        kasus = next((item for item in contoh if item["id"] == args.kasus), None)
        if kasus is None:
            parser.error("Id kasus tidak ditemukan. Gunakan --daftar untuk melihat pilihan.")
        teks = kasus["teks"]
    else:
        teks = args.teks

    try:
        if args.audio is not None:
            hasil = uji_analisis_audio(args.audio)
            if hasil.get("valid") is False:
                print(json.dumps({"success": False, "message": hasil["pesan"]}, ensure_ascii=False, indent=2))
                return 2
        else:
            hasil = uji_analisis_teks(teks)
        print(json.dumps({"success": True, "data": hasil}, ensure_ascii=False, indent=2))
        return 0
    except InputCurhatError as error:
        print(json.dumps({"success": False, "message": str(error)}, ensure_ascii=False, indent=2))
        return 2
    except ValueError as error:
        print(json.dumps({
            "success": False, "message": "Keluaran AI tidak sesuai struktur.", "detail": str(error)
        }, ensure_ascii=False, indent=2))
        return 1
    except Exception:
        print(json.dumps({
            "success": False,
            "message": (
                "Analisis belum berhasil. Periksa GEMINI_API_KEY, akses model "
                "yang dikonfigurasi proyek, koneksi, dan kuota Gemini."
            ),
        }, ensure_ascii=False, indent=2))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
