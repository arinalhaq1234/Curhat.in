from rest_framework import serializers
from django.contrib.auth.models import User

from .models import RiwayatCurhat


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
            "akar_masalah",
            "rekomendasi",
            "waktu",
        ]

        read_only_fields = [
            "id",
            "audio_name",
            "emosi",
            "akar_masalah",
            "rekomendasi",
            "waktu",
        ]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user