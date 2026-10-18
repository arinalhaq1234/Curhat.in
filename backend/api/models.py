from django.conf import settings
from django.db import models


class RiwayatCurhat(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="riwayat_curhat",
        null=True,
        blank=True,
        help_text="Pemilik data curhat"
    )

    teks = models.TextField(
        blank=True,
        null=True,
        help_text="Diisi jika curhat via teks"
    )

    audio_file = models.BinaryField(
        blank=True,
        null=True,
        help_text="Data file audio"
    )

    audio_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Nama file audio"
    )

    emosi = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    ringkasan_cerita = models.TextField(
        blank=True,
        null=True,
        help_text="Ringkasan singkat isi curhatan pengguna"
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