from django.contrib.auth import authenticate

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import RiwayatCurhat
from .serializers import RegisterSerializer, RiwayatCurhatSerializer
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
        error_message = str(e)

        if "429" in error_message or "rate limit" in error_message.lower():
            return Response(
                {
                    "success": False,
                    "message": "Batas penggunaan Gemini sedang tercapai.",
                    "error": "Silakan coba kembali beberapa saat lagi."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(
            {
                "success": False,
                "message": "Curhatan gagal diproses.",
                "error": error_message
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


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

    allowed_types = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/mp4",
        "audio/m4a",
        "audio/x-m4a",
    ]

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
        audio_bytes = file_audio.read()

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
        error_message = str(e)

        if "429" in error_message or "rate limit" in error_message.lower():
            return Response(
                {
                    "success": False,
                    "message": "Batas penggunaan Gemini sedang tercapai.",
                    "error": "Silakan coba kembali beberapa saat lagi."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(
            {
                "success": False,
                "message": "Audio gagal diproses.",
                "error": error_message
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


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