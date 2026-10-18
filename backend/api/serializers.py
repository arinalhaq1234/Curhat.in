from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

from .models import RiwayatCurhat


# =========================================================
# SERIALIZER RIWAYAT CURHAT
# =========================================================

class RiwayatCurhatSerializer(serializers.ModelSerializer):

    waktu = serializers.DateTimeField(
        format="%d-%m-%Y %H:%M:%S",
        read_only=True
    )

    class Meta:
        model = RiwayatCurhat

        fields = [
            "id",
            "teks",
            "audio_name",
            "emosi",
            "ringkasan_cerita",
            "akar_masalah",
            "rekomendasi",
            "waktu",
        ]

        read_only_fields = [
            "id",
            "audio_name",
            "emosi",
            "ringkasan_cerita",
            "akar_masalah",
            "rekomendasi",
            "waktu",
        ]


# =========================================================
# SERIALIZER REGISTRASI PENGGUNA
# =========================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        max_length=20,
        error_messages={
            "required": "Password wajib diisi.",
            "blank": "Password tidak boleh kosong.",
            "min_length": "Password minimal 8 karakter.",
            "max_length": "Password maksimal 20 karakter.",
        }
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
        ]

    def validate(self, attrs):
        """
        Memvalidasi password menggunakan aturan keamanan Django.
        """

        user = User(
            username=attrs.get("username", ""),
            email=attrs.get("email", "")
        )

        try:
            validate_password(
                password=attrs["password"],
                user=user
            )

        except DjangoValidationError as error:
            raise serializers.ValidationError({
                "password": error.messages
            })

        return attrs

    def create(self, validated_data):
        """
        Membuat pengguna dan menyimpan password
        menggunakan hashing bawaan Django.
        """

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )

        return user