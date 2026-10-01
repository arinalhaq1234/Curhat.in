from django.db import models


class RiwayatCurhat(models.Model):
    teks = models.TextField(
        blank=True,
        null=True
    )

    url_audio = models.URLField(
        blank=True,
        null=True
    )

    emosi = models.CharField(
        max_length=50,
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
        return f"Riwayat Curhat {self.id} - {self.emosi}"