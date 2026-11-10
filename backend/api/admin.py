from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError

from .models import RiwayatCurhat
from .services import analisis_teks, analisis_audio


# =========================================================
# FORM DJANGO ADMIN
# =========================================================

class RiwayatCurhatAdminForm(forms.ModelForm):

    # Input file audio langsung dari Django Admin
    audio_upload = forms.FileField(
        required=False,
        label="Audio File",
        help_text="Pilih file audio jika curhat menggunakan suara."
    )

    class Meta:
        model = RiwayatCurhat
        fields = [
            "teks",
            "audio_upload",
        ]

    def clean(self):
        cleaned_data = super().clean()

        teks = cleaned_data.get("teks")
        file_audio = cleaned_data.get("audio_upload")

        # Rapikan teks
        if teks:
            teks = teks.strip()
            cleaned_data["teks"] = teks

        # =====================================================
        # VALIDASI INPUT
        # =====================================================

        if not teks and not file_audio:
            raise ValidationError(
                "Masukkan teks curhat atau pilih file audio."
            )

        if teks and file_audio:
            raise ValidationError(
                "Gunakan salah satu input saja: teks atau audio."
            )

        # =====================================================
        # ANALISIS TEKS
        # =====================================================

        if teks:
            try:
                hasil_ai = analisis_teks(teks)

                cleaned_data["hasil_ai"] = hasil_ai

            except Exception as e:
                raise ValidationError(
                    f"Analisis teks dengan Gemini gagal: {str(e)}"
                )

        # =====================================================
        # ANALISIS AUDIO
        # =====================================================

        elif file_audio:

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
                raise ValidationError(
                    "Format audio tidak didukung. "
                    "Gunakan MP3, WAV, atau M4A."
                )

            try:
                # Baca file sekali
                audio_bytes = file_audio.read()

                # Simpan bytes agar bisa digunakan saat save()
                cleaned_data["audio_bytes"] = audio_bytes

                # Analisis audio menggunakan Gemini
                hasil_ai = analisis_audio(
                    audio_bytes=audio_bytes,
                    mime_type=file_audio.content_type
                )

                # Validasi hasil analisis Gemini
                if hasil_ai.get("valid") is False:
                    raise ValidationError(
                        hasil_ai.get(
                            "pesan",
                            "File yang diberikan bukan rekaman curhatan."
                        )
                    )

                cleaned_data["hasil_ai"] = hasil_ai

            except ValidationError:
                raise

            except Exception as e:
                raise ValidationError(
                    f"Analisis audio dengan Gemini gagal: {str(e)}"
                )

        return cleaned_data

    # =========================================================
    # SIMPAN DATA
    # =========================================================

    def save(self, commit=True):

        instance = super().save(commit=False)

        file_audio = self.cleaned_data.get("audio_upload")
        hasil_ai = self.cleaned_data.get("hasil_ai", {})

        # -----------------------------------------------------
        # Jika menggunakan audio
        # -----------------------------------------------------

        if file_audio:

            instance.audio_file = self.cleaned_data.get(
                "audio_bytes"
            )

            instance.audio_name = file_audio.name[:255]

            instance.teks = None

        # -----------------------------------------------------
        # Jika menggunakan teks
        # -----------------------------------------------------

        else:

            instance.audio_file = None
            instance.audio_name = None

        # -----------------------------------------------------
        # Simpan hasil analisis Gemini
        # -----------------------------------------------------

        instance.emosi = hasil_ai.get("emosi")
        instance.ringkasan_cerita = hasil_ai.get("ringkasan_cerita")
        instance.akar_masalah = hasil_ai.get("akar_masalah")
        instance.rekomendasi = hasil_ai.get("rekomendasi")

        if commit:
            instance.save()

        return instance


# =========================================================
# DJANGO ADMIN
# =========================================================

@admin.register(RiwayatCurhat)
class RiwayatCurhatAdmin(admin.ModelAdmin):

    form = RiwayatCurhatAdminForm

    def get_queryset(self, request):
        # Jangan ambil isi privat ketika admin hanya membaca metadata.
        return super().get_queryset(request).defer(
            "teks", "audio_file", "ringkasan_cerita", "akar_masalah",
            "rekomendasi",
        )

    readonly_fields = ("id", "waktu", "jenis_input", "status_analisis")
    fields = readonly_fields
    list_display = readonly_fields
    list_display_links = ("id",)
    search_fields = ("=id",)
    ordering = ("-waktu",)
    actions = None

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description="Jenis input")
    def jenis_input(self, obj):
        return "Audio" if obj.audio_name else "Teks"

    @admin.display(description="Status analisis")
    def status_analisis(self, obj):
        return "Selesai" if obj.emosi else "Belum dianalisis"
