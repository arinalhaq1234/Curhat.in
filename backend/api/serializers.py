from rest_framework import serializers

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