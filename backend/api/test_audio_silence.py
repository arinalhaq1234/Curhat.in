"""Regresi kegagalan live: WAV hening tidak boleh menghasilkan cerita buatan."""

import wave
from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from . import services
from .admin import RiwayatCurhatAdminForm
from .models import RiwayatCurhat
from .tests import hasil_contoh, rekaman_wav, respons_ai


def wav_pcm(lebar_sampel=2, nilai_sampel=None):
    buffer = BytesIO()
    if nilai_sampel is None:
        nilai_sampel = b"\x80" if lebar_sampel == 1 else b"\x00" * lebar_sampel
    with wave.open(buffer, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(lebar_sampel)
        audio.setframerate(8000)
        audio.writeframes(nilai_sampel * 800)
    return buffer.getvalue()


class DigitalSilenceTests(SimpleTestCase):
    def setUp(self):
        self.generate = self.enterContext(patch("api.services.generate_with_retry"))
        self.generate.return_value = respons_ai(hasil_contoh(audio=True))

    def test_signed_pcm_silence_is_rejected_without_gemini(self):
        for width in (2, 3, 4):
            with self.subTest(bytes_per_sample=width):
                result = services.analisis_audio(wav_pcm(width), "audio/wav")
                self.assertEqual(result, {
                    "valid": False, "pesan": services.ALASAN_PENOLAKAN_AUDIO["hening"]
                })
        self.generate.assert_not_called()

    def test_unsigned_pcm_silence_is_rejected_without_gemini(self):
        result = services.analisis_audio(wav_pcm(1), "audio/x-wav")
        self.assertEqual(result, {
            "valid": False, "pesan": services.ALASAN_PENOLAKAN_AUDIO["hening"]
        })
        self.generate.assert_not_called()

    def test_unsigned_zero_is_not_the_silence_midpoint(self):
        services.analisis_audio(wav_pcm(1, b"\x00"), "audio/wav")
        self.generate.assert_called_once()

    def test_nonzero_wav_still_uses_the_existing_gemini_pipeline(self):
        result = services.analisis_audio(rekaman_wav(), "audio/wav")
        self.assertTrue(result["valid"])
        self.generate.assert_called_once()


class DigitalSilenceBackendTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="silence_test_user")
        self.api = APIClient()
        self.api.force_authenticate(self.user)
        self.generate = self.enterContext(patch("api.services.generate_with_retry"))

    def upload(self):
        return SimpleUploadedFile("hening.wav", wav_pcm(), content_type="audio/wav")

    def test_silent_upload_is_400_without_gemini_or_history(self):
        response = self.api.post(
            "/api/curhat/audio/", {"audio": self.upload()}, format="multipart"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {
            "success": False, "message": services.ALASAN_PENOLAKAN_AUDIO["hening"]
        })
        self.generate.assert_not_called()
        self.assertFalse(RiwayatCurhat.objects.exists())

    def test_admin_rejects_silent_upload_without_gemini_or_history(self):
        form = RiwayatCurhatAdminForm(data={}, files={"audio_upload": self.upload()})
        self.assertFalse(form.is_valid())
        self.assertIn(services.ALASAN_PENOLAKAN_AUDIO["hening"], str(form.errors))
        self.generate.assert_not_called()
        self.assertFalse(RiwayatCurhat.objects.exists())
