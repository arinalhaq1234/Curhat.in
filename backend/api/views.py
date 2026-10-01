from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import RiwayatCurhat
from .serializers import RiwayatCurhatSerializer
from .services import analisis_audio, analisis_teks


# =========================================================
# HEALTH CHECK
# =========================================================

@api_view(["GET"])
def health_check(request):
    return Response(
        {
            "status": "ok",
            "message": "Curhat.in backend is running"
        },
        status=status.HTTP_200_OK
    )


# =========================================================
# CURHAT TEKS
# =========================================================

@api_view(["POST"])
def curhat_text(request):

    # Mengambil teks dari request frontend
    teks_curhat = request.data.get("teks", "")

    # Validasi input
    if not isinstance(teks_curhat, str) or not teks_curhat.strip():
        return Response(
            {
                "success": False,
                "message": "Teks curhat tidak boleh kosong."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    teks_curhat = teks_curhat.strip()

    try:
        # 1. Analisis teks menggunakan Gemini
        hasil_ai = analisis_teks(teks_curhat)

        # 2. Simpan hasil ke Supabase PostgreSQL
        riwayat = RiwayatCurhat.objects.create(
            teks=teks_curhat,
            url_audio=None,
            emosi=hasil_ai.get("emosi"),
            akar_masalah=hasil_ai.get("akar_masalah"),
            rekomendasi=hasil_ai.get("rekomendasi"),
        )

        # 3. Konversi data database menjadi JSON
        serializer = RiwayatCurhatSerializer(riwayat)

        # 4. Kirim response ke frontend
        return Response(
            {
                "success": True,
                "message": "Curhatan berhasil dianalisis.",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "Curhatan gagal diproses.",
                "error": str(e)
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


# =========================================================
# CURHAT AUDIO
# =========================================================

@api_view(["POST"])
def curhat_audio(request):

    # Mengambil file audio dari request frontend
    file_audio = request.FILES.get("audio")

    # Validasi file kosong
    if not file_audio:
        return Response(
            {
                "success": False,
                "message": "File audio tidak boleh kosong."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Format audio yang diizinkan
    allowed_types = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/mp4",
        "audio/m4a",
        "audio/x-m4a",
    ]

    # Validasi tipe file
    if file_audio.content_type not in allowed_types:
        return Response(
            {
                "success": False,
                "message": "Format file audio tidak didukung.",
                "format_diterima": [
                    "MP3",
                    "WAV",
                    "M4A"
                ]
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # 1. Membaca file audio
        audio_bytes = file_audio.read()

        # 2. Mengirim audio ke Gemini
        hasil_ai = analisis_audio(
            audio_bytes=audio_bytes,
            mime_type=file_audio.content_type
        )

        # 3. Validasi hasil Gemini
        # Jika file ternyata lagu/musik atau bukan curhatan
        if hasil_ai.get("valid") is False:
            return Response(
                {
                    "success": False,
                    "message": hasil_ai.get(
                        "pesan",
                        "File yang diberikan bukan rekaman curhatan."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Simpan hasil analisis ke Supabase PostgreSQL
        riwayat = RiwayatCurhat.objects.create(
            teks=None,

            # Untuk sementara NULL karena Supabase Storage
            # belum kita integrasikan
            url_audio=None,

            emosi=hasil_ai.get("emosi"),
            akar_masalah=hasil_ai.get("akar_masalah"),
            rekomendasi=hasil_ai.get("rekomendasi"),
        )

        # 5. Konversi data database menjadi JSON
        serializer = RiwayatCurhatSerializer(riwayat)

        # 6. Kirim response ke frontend
        return Response(
            {
                "success": True,
                "message": "Audio berhasil dianalisis.",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "Audio gagal diproses.",
                "error": str(e)
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )