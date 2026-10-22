import logging
import math
from io import BytesIO

from django.contrib.auth import authenticate
from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from mutagen import MutagenError
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4
from mutagen.wave import WAVE

from .models import RiwayatCurhat
from .serializers import RegisterSerializer, RiwayatCurhatSerializer
from .services import InputCurhatError, analisis_audio, analisis_teks


logger = logging.getLogger(__name__)

# Batas upload sesuai kesepakatan BE-002.
MAX_AUDIO_SIZE = 15_000_000      # 15 MB (desimal)
MAX_AUDIO_DURATION = 10 * 60       # 10 menit (detik)

# MIME type dari upload digunakan untuk memilih pemeriksa format nyata.
AUDIO_PARSERS = {
    "audio/mpeg": MP3,
    "audio/mp3": MP3,
    "audio/wav": WAVE,
    "audio/x-wav": WAVE,
    "audio/mp4": MP4,
    "audio/m4a": MP4,
    "audio/x-m4a": MP4,
}


def baca_durasi_audio(audio_bytes, mime_type):
    """Baca durasi audio sesungguhnya, bukan berdasarkan nama file."""
    try:
        audio = AUDIO_PARSERS[mime_type](BytesIO(audio_bytes))
        durasi = float(audio.info.length)
    except (MutagenError, OSError, ValueError, AttributeError, TypeError, EOFError) as error:
        raise ValueError("File audio rusak atau tidak dapat dibaca.") from error

    if not math.isfinite(durasi) or durasi <= 0:
        raise ValueError("Durasi audio tidak valid.")

    return durasi


# =========================================================
# PENANGANAN ERROR CURHAT (BE-004)
# =========================================================

def tangani_error_curhat(error, jenis):
    """Catat detail teknis di server, kirim pesan aman ke pengguna."""
    if isinstance(error, InputCurhatError):
        return Response(
            {"success": False, "message": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    logger.exception("Gagal memproses curhat %s", jenis)

    if isinstance(error, DatabaseError):
        return Response(
            {
                "success": False,
                "message": (
                    "Hasil analisis belum dapat disimpan. "
                    "Silakan coba kembali beberapa saat lagi."
                )
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    if isinstance(error, ValueError):
        return Response(
            {
                "success": False,
                "message": (
                    "Hasil analisis AI tidak valid. "
                    "Silakan coba kembali."
                )
            },
            status=status.HTTP_502_BAD_GATEWAY
        )

    pesan_error = str(error).lower()

    if any(kata in pesan_error for kata in [
        "429",
        "resource_exhausted",
        "rate limit",
        "batas penggunaan gemini",
    ]):
        return Response(
            {
                "success": False,
                "message": (
                    "Batas penggunaan Gemini sedang tercapai. "
                    "Silakan coba kembali beberapa saat lagi."
                )
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    if (
        isinstance(error, RuntimeError)
        or "503" in pesan_error
        or "unavailable" in pesan_error
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Layanan AI sedang mengalami gangguan. "
                    "Silakan coba kembali."
                )
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    return Response(
        {
            "success": False,
            "message": (
                "Terjadi kesalahan pada server. "
                "Silakan coba kembali."
            )
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


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
@permission_classes([IsAuthenticated])
def curhat_text(request):
    teks_curhat = request.data.get("teks", "")

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
        hasil_ai = analisis_teks(teks_curhat)

        riwayat = RiwayatCurhat.objects.create(
            user=request.user,
            teks=teks_curhat,
            emosi=hasil_ai.get("emosi"),
            ringkasan_cerita=hasil_ai.get("ringkasan_cerita"),
            akar_masalah=hasil_ai.get("akar_masalah"),
            rekomendasi=hasil_ai.get("rekomendasi"),
        )

        serializer = RiwayatCurhatSerializer(riwayat)

        return Response(
            {
                "success": True,
                "message": "Curhatan berhasil dianalisis.",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return tangani_error_curhat(e, "teks")


# =========================================================
# CURHAT AUDIO
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def curhat_audio(request):
    file_audio = request.FILES.get("audio")

    if not file_audio:
        return Response(
            {
                "success": False,
                "message": "File audio tidak boleh kosong."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if file_audio.content_type not in AUDIO_PARSERS:
        return Response(
            {
                "success": False,
                "message": "Format file audio tidak didukung.",
                "format_diterima": ["MP3", "WAV", "M4A"],
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Cek ukuran sebelum membaca isi audio dan sebelum mengirim ke Gemini.
    if file_audio.size == 0:
        return Response(
            {
                "success": False,
                "message": "File audio tidak boleh kosong.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if file_audio.size > MAX_AUDIO_SIZE:
        return Response(
            {
                "success": False,
                "message": "Ukuran audio maksimal 15 MB.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Baca isi sekali, lalu validasi format asli dan durasinya.
    audio_bytes = file_audio.read()
    try:
        durasi_audio = baca_durasi_audio(
            audio_bytes, file_audio.content_type
        )
    except ValueError:
        return Response(
            {
                "success": False,
                "message": "File audio rusak atau tidak dapat dibaca.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if durasi_audio > MAX_AUDIO_DURATION:
        return Response(
            {
                "success": False,
                "message": "Durasi audio maksimal 10 menit.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        hasil_ai = analisis_audio(
            audio_bytes=audio_bytes,
            mime_type=file_audio.content_type
        )

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

        riwayat = RiwayatCurhat.objects.create(
            user=request.user,
            teks=None,
            audio_file=audio_bytes,
            audio_name=file_audio.name,
            emosi=hasil_ai.get("emosi"),
            ringkasan_cerita=hasil_ai.get("ringkasan_cerita"),
            akar_masalah=hasil_ai.get("akar_masalah"),
            rekomendasi=hasil_ai.get("rekomendasi"),
        )

        serializer = RiwayatCurhatSerializer(riwayat)

        return Response(
            {
                "success": True,
                "message": "Audio berhasil dianalisis.",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return tangani_error_curhat(e, "audio")


# =========================================================
# REGISTER
# =========================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Registrasi berhasil.",
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        {
            "success": False,
            "message": "Registrasi gagal.",
            "errors": serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )


# =========================================================
# LOGIN
# =========================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")

    if not username or not password:
        return Response(
            {
                "success": False,
                "message": "Username dan password wajib diisi."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(
        username=username,
        password=password
    )

    if user is None:
        return Response(
            {
                "success": False,
                "message": "Username atau password salah."
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "success": True,
            "message": "Login berhasil.",
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_staff": user.is_staff,
                }
            }
        },
        status=status.HTTP_200_OK
    )


# =========================================================
# PROFILE
# =========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user

    return Response(
        {
            "success": True,
            "message": "Profil berhasil diambil.",
            "data": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            }
        },
        status=status.HTTP_200_OK
    )


# =========================================================
# LOGOUT
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response(
            {
                "success": False,
                "message": "Refresh token wajib dikirim."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response(
            {
                "success": True,
                "message": "Logout berhasil."
            },
            status=status.HTTP_200_OK
        )

    except Exception:
        return Response(
            {
                "success": False,
                "message": "Refresh token tidak valid atau sudah tidak berlaku."
            },
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# ADMIN CHECK
# =========================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_check(request):
    return Response(
        {
            "success": True,
            "message": "Akses admin berhasil.",
            "data": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "is_staff": request.user.is_staff,
                "is_superuser": request.user.is_superuser,
            }
        },
        status=status.HTTP_200_OK
    )
