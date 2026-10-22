"""Regresi integrasi AI-004; mock tidak menilai kualitas rekomendasi Gemini."""

import importlib.util
import json
import sys
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from . import services
from .models import RiwayatCurhat
from .tests import hasil_contoh, rekaman_wav, respons_ai


REKOMENDASI_MOBILE = (
    "Memikirkan biaya kuliah saat uang terbatas bisa membuatmu cemas.\n\n"
    "1. Catat jumlah biaya dan tenggat yang perlu diprioritaskan.\n\n"
    "2. Jika memungkinkan, tanyakan pilihan bantuan atau cicilan kepada pihak kampus."
)
PROJECT_DIR = Path(__file__).resolve().parents[2]
FIELD_BE002 = {"emosi", "ringkasan_cerita", "akar_masalah", "rekomendasi"}


def hasil_rekomendasi(rekomendasi=REKOMENDASI_MOBILE, *, audio=False):
    """Contoh struktur untuk transport data, bukan hasil evaluasi model."""
    return {**hasil_contoh(audio=audio), "rekomendasi": rekomendasi}


class RecommendationPipelineTests(SimpleTestCase):
    def setUp(self):
        self.gemini = self.enterContext(patch("api.services.client"))
        self.generate = self.gemini.models.generate_content
        self.enterContext(patch("api.services.time.sleep"))

    def test_text_and_audio_receive_the_same_recommendation_instructions(self):
        for audio in (False, True):
            with self.subTest(audio=audio):
                self.generate.reset_mock()
                self.generate.return_value = respons_ai(hasil_rekomendasi(audio=audio))
                if audio:
                    services.analisis_audio(rekaman_wav(), "audio/wav")
                    expected_prompt = services.PROMPT_AUDIO
                else:
                    services.analisis_teks("Aku cemas memikirkan biaya kuliah.")
                    expected_prompt = services.PROMPT_TEKS
                self.generate.assert_called_once()
                config = self.generate.call_args.kwargs["config"]
                self.assertEqual(config.system_instruction, expected_prompt)
                self.assertTrue(services.INSTRUKSI_REKOMENDASI.strip())
                self.assertIn(services.INSTRUKSI_REKOMENDASI, config.system_instruction)
                self.assertEqual(config.response_mime_type, "application/json")

    def test_text_preserves_numbered_lines_without_a_second_generation(self):
        teks = "Aku cemas karena uangku tidak cukup untuk membayar kuliah."
        self.generate.return_value = respons_ai(hasil_rekomendasi())
        hasil = services.analisis_teks(teks)
        self.assertEqual(set(hasil), FIELD_BE002)
        self.assertEqual(hasil["rekomendasi"], REKOMENDASI_MOBILE)
        self.generate.assert_called_once()
        self.assertEqual(self.generate.call_args.kwargs["contents"], teks)

    def test_audio_preserves_numbered_lines_and_internal_validation_status(self):
        audio_bytes = rekaman_wav()
        self.generate.return_value = respons_ai(hasil_rekomendasi(audio=True))
        hasil = services.analisis_audio(audio_bytes, "audio/wav")
        self.assertEqual(set(hasil), FIELD_BE002 | {"valid"})
        self.assertIs(hasil["valid"], True)
        self.assertEqual(hasil["rekomendasi"], REKOMENDASI_MOBILE)
        self.generate.assert_called_once()
        contents = self.generate.call_args.kwargs["contents"]
        self.assertEqual(contents[0].inline_data.data, audio_bytes)

    def test_word_target_does_not_truncate_or_reject_existing_strings(self):
        short = "Cobalah mulai dari satu tugas kecil yang paling mendesak."
        long = " ".join(["Saran yang sudah lengkap tidak boleh dipotong otomatis."] * 30)
        paragraph = (
            "Rasa kehilangan itu bisa terasa berat. Jika kamu merasa siap, "
            "cobalah bercerita kepada seseorang yang kamu percaya."
        )
        self.assertLess(len(short.split()), 80)
        self.assertGreater(len(long.split()), 150)
        for rekomendasi in (short, long, paragraph):
            with self.subTest(jumlah_kata=len(rekomendasi.split())):
                hasil = services.validasi_hasil_analisis(hasil_rekomendasi(rekomendasi))
                self.assertEqual(hasil["rekomendasi"], rekomendasi)

    def test_recommendation_remains_a_string_not_an_array_or_new_fields(self):
        cases = (
            hasil_rekomendasi(["Satu langkah", "Langkah berikutnya"]),
            {**hasil_rekomendasi(), "langkah": ["Field belum disepakati"]},
            {**hasil_rekomendasi(), "respons_empatik": "Field belum disepakati"},
        )
        for hasil in cases:
            with self.subTest(fields=set(hasil)), self.assertRaises(ValueError):
                services.validasi_hasil_analisis(hasil)


class RecommendationBackendTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="ai004_user", password="Test-only-ai004-927!"
        )
        self.api = APIClient()
        self.api.force_authenticate(self.user)
        self.gemini = self.enterContext(patch("api.services.client"))
        self.generate = self.gemini.models.generate_content
        self.enterContext(patch("api.views.logger.exception"))

    def test_numbered_string_survives_text_and_audio_json_and_database(self):
        for audio in (False, True):
            with self.subTest(audio=audio):
                self.generate.reset_mock()
                self.generate.return_value = respons_ai(hasil_rekomendasi(audio=audio))
                if audio:
                    upload = SimpleUploadedFile(
                        "curhat.wav", rekaman_wav(), content_type="audio/wav"
                    )
                    response = self.api.post(
                        "/api/curhat/audio/", {"audio": upload}, format="multipart"
                    )
                else:
                    response = self.api.post(
                        "/api/curhat/text/",
                        {"teks": "Aku cemas memikirkan biaya kuliah karena uang terbatas."},
                        format="json",
                    )
                self.assertEqual(response.status_code, 201)
                rendered = json.loads(response.content)
                self.assertEqual(rendered["data"]["rekomendasi"], REKOMENDASI_MOBILE)
                self.assertNotIn("valid", rendered["data"])
                record = RiwayatCurhat.objects.get(pk=rendered["data"]["id"])
                self.assertEqual(record.rekomendasi, REKOMENDASI_MOBILE)
                self.assertEqual(record.user_id, self.user.pk)
                for field in FIELD_BE002:
                    self.assertIsInstance(rendered["data"][field], str)
                self.generate.assert_called_once()
        self.assertEqual(RiwayatCurhat.objects.count(), 2)

    def test_array_recommendation_is_rejected_for_both_endpoints_without_history(self):
        for audio in (False, True):
            with self.subTest(audio=audio):
                self.generate.reset_mock()
                self.generate.return_value = respons_ai(
                    hasil_rekomendasi(["Jangan ubah kontrak menjadi array"], audio=audio)
                )
                if audio:
                    upload = SimpleUploadedFile(
                        "curhat.wav", rekaman_wav(), content_type="audio/wav"
                    )
                    response = self.api.post(
                        "/api/curhat/audio/", {"audio": upload}, format="multipart"
                    )
                else:
                    response = self.api.post(
                        "/api/curhat/text/", {"teks": "Aku cemas."}, format="json"
                    )
                self.assertEqual(response.status_code, 502)
                self.assertFalse(RiwayatCurhat.objects.exists())
                self.generate.assert_called_once()


class RecommendationExamplesTests(SimpleTestCase):
    def test_ai004_reference_outputs_follow_the_existing_be002_schema(self):
        path = PROJECT_DIR / "backend" / "api" / "examples" / "ai004_cases.json"
        cases = json.loads(path.read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(cases), 8)
        self.assertEqual(len({case["id"] for case in cases}), len(cases))
        for case in cases:
            with self.subTest(kasus=case["id"]):
                self.assertIsInstance(case["teks"], str)
                self.assertTrue(case["teks"].strip())
                hasil = services.validasi_hasil_analisis(case["contoh_hasil"])
                self.assertEqual(set(hasil), FIELD_BE002)

    def test_cli_can_list_ai004_examples_without_creating_a_gemini_client(self):
        script = PROJECT_DIR / "percobaan API Gemini" / "uji_curhat_final.py"
        spec = importlib.util.spec_from_file_location("ai004_cli_under_test", script)
        cli = importlib.util.module_from_spec(spec)
        output = StringIO()
        with patch("api.services.genai.Client") as constructor, \
                patch.object(sys, "argv", [str(script), "--tahap", "ai004", "--daftar"]), \
                redirect_stdout(output):
            spec.loader.exec_module(cli)
            with patch.object(cli, "analisis_teks") as text_analysis, \
                    patch.object(cli, "analisis_audio") as audio_analysis:
                result = cli.main()
            text_analysis.assert_not_called()
            audio_analysis.assert_not_called()
        constructor.assert_not_called()
        self.assertEqual(result, 0)
        cases = json.loads(output.getvalue())
        expected = json.loads(
            (PROJECT_DIR / "backend" / "api" / "examples" / "ai004_cases.json")
            .read_text(encoding="utf-8")
        )
        self.assertEqual(cases, expected)
