"""BE-007: pertukaran Google ID token menjadi JWT Curhat.in untuk mobile."""

from uuid import uuid4

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import DatabaseError, IntegrityError, transaction
from google.auth.exceptions import GoogleAuthError, TransportError
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import GoogleIdentity


def failure(message, status):
    return Response({"success": False, "message": message}, status=status)


def verified_identity(request):
    """Return (subject, email, error) after validating a Google ID token."""
    token = request.data.get("id_token") if isinstance(request.data, dict) else None
    if not isinstance(token, str) or not token.strip() or len(token) > 16384:
        return None, None, failure("id_token wajib diisi dengan Google ID token yang valid.", 400)
    if not settings.GOOGLE_CLIENT_ID:
        return None, None, failure("Login Google belum tersedia. Silakan gunakan metode login lain.", 503)

    try:
        claims = id_token.verify_oauth2_token(
            token.strip(), Request(), audience=settings.GOOGLE_CLIENT_ID,
        )
    except TransportError:
        return None, None, failure("Layanan verifikasi Google tidak tersedia. Silakan coba kembali.", 503)
    except (ValueError, GoogleAuthError):
        return None, None, failure("Google ID token tidak valid atau kedaluwarsa. Silakan login Google kembali.", 401)

    subject = claims.get("sub")
    email = claims.get("email")
    if (not isinstance(subject, str) or not subject.strip() or len(subject) > 255
            or not isinstance(email, str) or len(email) > 254
            or claims.get("email_verified") is not True):
        return None, None, failure("Identitas atau email Google belum terverifikasi.", 401)
    email = email.strip().lower()
    try:
        validate_email(email)
    except ValidationError:
        return None, None, failure("Email Google tidak valid.", 401)
    return subject, email, None


def forbidden_account(user):
    return not user.is_active or user.is_staff or user.is_superuser


def success(user):
    refresh = RefreshToken.for_user(user)
    return Response({
        "success": True,
        "message": "Login berhasil.",
        "data": {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id, "username": user.username,
                "email": user.email, "is_staff": user.is_staff,
            },
        },
    })


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def google_register(request):
    subject, email, error = verified_identity(request)
    if error is not None:
        return error

    User = get_user_model()
    try:
        with transaction.atomic():
            identity = GoogleIdentity.objects.select_related("user").filter(subject=subject).first()
            if identity:
                if forbidden_account(identity.user):
                    return failure("Akun ini tidak diizinkan menggunakan login Google mobile.", 403)
                return failure("Akun Google sudah terdaftar. Silakan masuk melalui halaman Login.", 409)
            if User.objects.filter(email__iexact=email).exists():
                return failure("Email sudah digunakan. Masuk menggunakan metode login akun yang sudah ada; akun tidak ditautkan otomatis.", 409)
            user = User.objects.create_user(
                username="google_" + uuid4().hex,
                email=email, password=None, is_staff=False, is_superuser=False,
            )
            GoogleIdentity.objects.create(user=user, subject=subject, email=email)
            if forbidden_account(user):
                return failure("Akun ini tidak diizinkan menggunakan login Google mobile.", 403)
            return success(user)
    except IntegrityError:
        # Constraint sub/email menghalangi akun ganda pada request bersamaan.
        return failure("Identitas atau email sudah digunakan. Silakan masuk melalui halaman Login atau gunakan metode akun yang sesuai.", 409)
    except DatabaseError:
        return failure("Login belum dapat diproses. Silakan coba kembali.", 503)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def google_login(request):
    subject, _email, error = verified_identity(request)
    if error is not None:
        return error

    try:
        identity = GoogleIdentity.objects.select_related("user").filter(subject=subject).first()
        if identity is None:
            return failure("Akun Google belum terdaftar. Silakan mendaftar terlebih dahulu.", 404)
        if forbidden_account(identity.user):
            return failure("Akun ini tidak diizinkan menggunakan login Google mobile.", 403)
        return success(identity.user)
    except DatabaseError:
        return failure("Login belum dapat diproses. Silakan coba kembali.", 503)
