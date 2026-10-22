"""Regresi perluasan AI-003: Bahagia, kontrak data, dan penyimpanan.

Respons Gemini dimock; tes ini tidak membuktikan ketepatan klasifikasi live.
"""

import json
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from . import services
from .admin import RiwayatCurhatAdminForm
from .models import RiwayatCurhat
from .tests import rekaman_wav, respons_ai


FIELD_BE002 = {"emosi", "ringkasan_cerita", "akar_masalah", "rekomendasi"}
CERITA_BAHAGIA = (
    "Hari ini aku akhirnya lulus sidang skripsi setelah berbulan-bulan berusaha. "
    "Aku senang sekali dan ingin menikmati pencapaian ini dengan istirahat sebentar."
)


def hasil_bahagia(*, audio=False):
    """Fixture buatan untuk validasi/transport, bukan hasil Gemini sungguhan."""
    hasil = {
        "emosi": "Bahagia",
        "ringkasan_cerita": "Kamu senang setelah lulus sidang skripsi dan ingin beristirahat.",
        "akar_masalah": "Kelulusan sidang setelah berbulan-bulan berusaha menjadi sumber kebahagiaan.",
        "rekomendasi": (
            "Pencapaian setelah usaha panjang ini bisa menjadi momen yang menyenangkan.\n\n"
            "1. Nikmati waktu beristirahat sesuai keinginanmu.\n\n"
            "2. Jika ingin, catat bagian perjuangan yang paling berarti sebagai kenangan."
        ),
    }
    if audio:
        hasil["valid"] = True
    return hasil


class BahagiaAnalysisTests(SimpleTestCase):
    def setUp(self):
        self.generate = self.enterContext(patch("api.services.generate_with_retry"))
        self.enterContext(patch(
            "api.services.genai.Client",
            side_effect=AssertionError("Tes tidak boleh membuka koneksi Gemini"),
        ))

    def test_exactly_eight_canonical_categories_are_supported(self):
        self.assertEqual(set(services.KATEGORI_EMOSI.values()), {
            "Cemas", "Sedih", "Takut", "Marah", "Tertekan", "Kesepian", "Bahagia", "Netral"
        })
        self.assertEqual(len(services.KATEGORI_EMOSI), 8)

    def test_bahagia_is_normalized_for_text_and_audio_without_new_fields(self):
        for audio in (False, True):
            for label in ("Bahagia", " bahagia ", "BAHAGIA"):
                with self.subTest(audio=audio, label=label):
                    result = services.validasi_hasil_analisis(
                        {**hasil_bahagia(audio=audio), "emosi": label}, dari_audio=audio
                    )
                    self.assertEqual(result, hasil_bahagia(audio=audio))
                    self.assertEqual(set(result), FIELD_BE002 | ({"valid"} if audio else set()))
        # Satu label baku: sinonim/terjemahan tidak diam-diam menjadi kategori lain.
        for label in ("Happy", "Heppy", "Senang", "Euforia"):
            with self.subTest(label=label), self.assertRaises(ValueError):
                services.validasi_hasil_analisis({**hasil_bahagia(), "emosi": label})

    def test_both_prompts_include_happiness_context_and_non_problem_guidance(self):
        for prompt in (services.PROMPT_TEKS, services.PROMPT_AUDIO):
            with self.subTest(audio=prompt is services.PROMPT_AUDIO):
                self.assertIn(services.INSTRUKSI_ANALISIS, prompt)
                self.assertIn("- Bahagia:", prompt)
                self.assertIn('"aku tidak bahagia"', prompt)
                self.assertIn("kebahagiaan tokoh lain", prompt)
                self.assertIn("faktor kebahagiaan", prompt)
                self.assertIn("Jangan otomatis mengutamakan emosi negatif", prompt)
                self.assertIn("tanpa\n  mengarang masalah", prompt)

    def test_text_accepts_bahagia_using_the_existing_single_call_pipeline(self):
        self.generate.return_value = respons_ai(hasil_bahagia())
        self.assertEqual(services.analisis_teks(CERITA_BAHAGIA), hasil_bahagia())
        self.generate.assert_called_once_with(
            CERITA_BAHAGIA, system_instruction=services.PROMPT_TEKS
        )

    def test_audio_accepts_bahagia_and_preserves_multimodal_bytes(self):
        self.generate.return_value = respons_ai(hasil_bahagia(audio=True))
        self.assertEqual(
            services.analisis_audio(rekaman_wav(), "audio/wav"), hasil_bahagia(audio=True)
        )
        self.generate.assert_called_once()
        args, kwargs = self.generate.call_args
        self.assertEqual(args[0][0].inline_data.data, rekaman_wav())
        self.assertEqual(kwargs["system_instruction"], services.PROMPT_AUDIO)

    def test_ai003_examples_cover_eight_categories_and_happiness_edge_cases(self):
        path = Path(__file__).resolve().parent / "examples" / "ai003_cases.json"
        cases = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(len({case["id"] for case in cases}), len(cases))
        self.assertEqual(
            {case["emosi_diharapkan"] for case in cases if case["diterima"]},
            set(services.KATEGORI_EMOSI.values()),
        )
        expected = {
            "bahagia": "Bahagia", "singkat-bahagia": "Bahagia",
            "negasi-bahagia": "Sedih", "emosi-campuran-bahagia": "Bahagia",
            "bahagia-tokoh-lain": "Kesepian", "netral": "Netral",
            "instruksi-dalam-cerita": "Sedih",
        }
        by_id = {case["id"]: case for case in cases}
        for case_id, label in expected.items():
            with self.subTest(case=case_id):
                self.assertEqual(by_id[case_id]["emosi_diharapkan"], label)
                self.assertTrue(by_id[case_id]["diterima"])
        self.generate.assert_not_called()


class BahagiaBackendTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="bahagia_user")
        self.other = get_user_model().objects.create_user(username="bahagia_other")
        self.api = APIClient()
        self.api.force_authenticate(self.user)
        self.generate = self.enterContext(patch("api.services.generate_with_retry"))
        self.enterContext(patch(
            "api.services.genai.Client",
            side_effect=AssertionError("Tes tidak boleh membuka koneksi Gemini"),
        ))

    def upload(self):
        return SimpleUploadedFile("bahagia.wav", rekaman_wav(), content_type="audio/wav")

    def check_saved_response(self, response):
        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        record = RiwayatCurhat.objects.get(pk=data["id"])
        self.assertEqual(record.user_id, self.user.pk)
        for field, value in hasil_bahagia().items():
            self.assertEqual(data[field], value)
            self.assertEqual(getattr(record, field), value)
        self.assertNotIn("valid", data)
        self.generate.assert_called_once()
        return record

    def test_text_persists_bahagia_and_ignores_forged_owner_and_emotion(self):
        self.generate.return_value = respons_ai(hasil_bahagia())
        response = self.api.post("/api/curhat/text/", {
            "teks": CERITA_BAHAGIA, "user_id": self.other.pk, "emosi": "Sedih",
        }, format="json")
        record = self.check_saved_response(response)
        self.assertEqual(record.teks, CERITA_BAHAGIA)

    def test_audio_persists_bahagia_and_preserves_the_existing_file_flow(self):
        self.generate.return_value = respons_ai(hasil_bahagia(audio=True))
        response = self.api.post("/api/curhat/audio/", {
            "audio": self.upload(), "user_id": self.other.pk, "emosi": "Sedih",
        }, format="multipart")
        record = self.check_saved_response(response)
        self.assertEqual(bytes(record.audio_file), rekaman_wav())

    def test_admin_text_and_audio_can_save_bahagia_without_model_changes(self):
        for audio in (False, True):
            with self.subTest(audio=audio):
                self.generate.reset_mock()
                self.generate.return_value = respons_ai(hasil_bahagia(audio=audio))
                form = (
                    RiwayatCurhatAdminForm(data={}, files={"audio_upload": self.upload()})
                    if audio else RiwayatCurhatAdminForm(data={"teks": CERITA_BAHAGIA})
                )
                self.assertTrue(form.is_valid(), form.errors)
                record = form.save()
                record.refresh_from_db()
                for field, value in hasil_bahagia().items():
                    self.assertEqual(getattr(record, field), value)
                self.generate.assert_called_once()
