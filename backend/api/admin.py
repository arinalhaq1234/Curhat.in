from django.contrib import admin
from django import forms

from .models import RiwayatCurhat


class RiwayatCurhatAdminForm(forms.ModelForm):

    # Input file untuk Choose File
    audio_upload = forms.FileField(
        required=False,
        label="Audio file",
        help_text="Diisi jika curhat via suara"
    )

    class Meta:
        model = RiwayatCurhat
        fields = [
            "teks",
            "audio_upload",
            "emosi",
            "akar_masalah",
            "rekomendasi",
        ]

    def save(self, commit=True):
        instance = super().save(commit=False)

        file_audio = self.cleaned_data.get("audio_upload")

        if file_audio:
            # Membaca file sebagai bytes
            instance.audio_file = file_audio.read()

            # Menyimpan nama file
            instance.audio_name = file_audio.name

        if commit:
            instance.save()

        return instance


@admin.register(RiwayatCurhat)
class RiwayatCurhatAdmin(admin.ModelAdmin):

    form = RiwayatCurhatAdminForm

    list_display = (
        "id",
        "teks_singkat",
        "audio_name",
        "emosi",
        "akar_masalah_singkat",
        "waktu",
    )

    def teks_singkat(self, obj):
        if not obj.teks:
            return "-"
        return obj.teks[:50]

    teks_singkat.short_description = "Teks Curhat"

    def akar_masalah_singkat(self, obj):
        if not obj.akar_masalah:
            return "-"
        return obj.akar_masalah[:50]

    akar_masalah_singkat.short_description = "Akar Masalah"