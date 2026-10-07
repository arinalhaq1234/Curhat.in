from django.db import models


class RiwayatCurhat(models.Model):
    teks = models.TextField(
        blank=True,
        null=True,
        help_text="Diisi jika curhat via teks"
    )

    # File audio disimpan sebagai data biner
    audio_file = models.BinaryField(
        blank=True,
        null=True,
        help_text="Data file audio"
    )

    # Menyimpan nama asli file audio
    audio_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Nama file audio"
    )

    # Hasil analisis Gemini
    emosi = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    akar_masalah = models.TextField(
        blank=True,
        null=True
    )

    rekomendasi = models.TextField(
        blank=True,
        null=True
    )

    waktu = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Curhatan ({self.waktu.strftime('%d-%m-%Y %H:%M')})"