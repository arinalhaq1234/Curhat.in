
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

from .models import RiwayatCurhat


# =========================================================
# SERIALIZER DETAIL RIWAYAT CURHAT (BE-004 / BE-005)
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
# SERIALIZER DAFTAR RIWAYAT CURHAT (BE-005)
# =========================================================

class RiwayatCurhatListSerializer(serializers.ModelSerializer):

    jenis = serializers.SerializerMethodField()

    waktu = serializers.DateTimeField(
        format="%d-%m-%Y %H:%M:%S",
        read_only=True
    )

    class Meta:
        model = RiwayatCurhat

        fields = [
            "id",
            "jenis",
            "emosi",
            "ringkasan_cerita",
            "audio_name",
            "waktu",
        ]

        read_only_fields = fields

    def get_jenis(self, obj):
        """
        Menentukan jenis curhat berdasarkan data tersimpan.
        """

        if obj.audio_name:
            return "audio"

        return "teks"


# =========================================================
# SERIALIZER REGISTRASI PENGGUNA (BE-003)
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
        Membuat pengguna dengan password yang di-hash Django.
        """

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )

        return user
