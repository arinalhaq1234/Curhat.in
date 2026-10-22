"""Regresi kontrak penolakan audio; mock tidak membuktikan klasifikasi Gemini."""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from . import services
from .models import RiwayatCurhat
from .tests import hasil_contoh, rekaman_wav, respons_ai


KODE_PENOLAKAN = (
    "musik_dominan",
    "suara_tidak_jelas",
    "kebisingan_dominan",
    "hening",
    "materi_tanpa_curhat",
    "cerita_belum_jelas",
    "bukan_curhat",
)


def penolakan(kode):
    return {"valid": False, "alasan": kode, "pesan": "Rekaman tidak dapat dianalisis."}


class AudioRejectionValidationTests(SimpleTestCase):
    def test_each_known_reason_replaces_a_generic_model_message(self):
        for kode in KODE_PENOLAKAN:
            with self.subTest(alasan=kode):
                hasil = services.validasi_hasil_analisis(penolakan(kode), dari_audio=True)
                self.assertEqual(hasil, {
                    "valid": False,
                    "pesan": services.ALASAN_PENOLAKAN_AUDIO[kode],
                })
                self.assertNotEqual(hasil["pesan"], penolakan(kode)["pesan"])
                self.assertIsInstance(hasil["pesan"], str)
                self.assertTrue(hasil["pesan"].strip())

    def test_different_audio_problems_have_different_canonical_messages(self):
        pesan = [services.ALASAN_PENOLAKAN_AUDIO[kode] for kode in KODE_PENOLAKAN]
        self.assertEqual(len(pesan), len(set(pesan)))

    def test_unknown_or_wrong_reason_types_are_output_errors(self):
        for kode in ("tidak_dikenal", "", "  ", None, [], {}, True, 1):
            with self.subTest(alasan=kode), self.assertRaises(ValueError) as error:
                services.validasi_hasil_analisis(penolakan(kode), dari_audio=True)
            self.assertNotIsInstance(error.exception, services.InputCurhatError)

    def test_coded_rejection_still_requires_an_exact_schema_and_nonempty_message(self):
        kasus = [
            {"valid": False, "alasan": "musik_dominan"},
            {**penolakan("musik_dominan"), "emosi": "Netral"},
        ]
        for pesan in (None, "", "  ", [], True):
            kasus.append({**penolakan("musik_dominan"), "pesan": pesan})
        for hasil in kasus:
            with self.subTest(hasil=hasil), self.assertRaises(ValueError) as error:
                services.validasi_hasil_analisis(hasil, dari_audio=True)
            self.assertNotIsInstance(error.exception, services.InputCurhatError)

    def test_audio_reason_is_not_accepted_as_a_text_rejection(self):
        with self.assertRaises(ValueError) as error:
            services.validasi_hasil_analisis(penolakan("cerita_belum_jelas"))
        self.assertNotIsInstance(error.exception, services.InputCurhatError)

    def test_successful_text_and_audio_cannot_include_a_rejection_reason(self):
        for audio in (False, True):
            with self.subTest(audio=audio), self.assertRaises(ValueError) as error:
                services.validasi_hasil_analisis(
                    {**hasil_contoh(audio=audio), "alasan": "materi_tanpa_curhat"},
                    dari_audio=audio,
                )
            self.assertNotIsInstance(error.exception, services.InputCurhatError)


class AudioRejectionPipelineTests(SimpleTestCase):
    def setUp(self):
        self.gemini = self.enterContext(patch("api.services.client"))
        self.generate = self.gemini.models.generate_content
        self.enterContext(patch("api.services.time.sleep"))

    def test_coded_rejections_use_audio_instructions_and_a_single_generation(self):
        for kode in KODE_PENOLAKAN:
            with self.subTest(alasan=kode):
                self.generate.reset_mock()
                self.generate.return_value = respons_ai(penolakan(kode))
                hasil = services.analisis_audio(rekaman_wav(), "audio/wav")
                self.assertEqual(hasil, {
                    "valid": False, "pesan": services.ALASAN_PENOLAKAN_AUDIO[kode]
                })
                self.generate.assert_called_once()
                config = self.generate.call_args.kwargs["config"]
                self.assertEqual(config.system_instruction, services.PROMPT_AUDIO)
                self.assertTrue(services.INSTRUKSI_VALIDASI_AUDIO.strip())
                self.assertIn(services.INSTRUKSI_VALIDASI_AUDIO, config.system_instruction)

    def test_legacy_rejections_remain_compatible_without_an_extra_generation(self):
        hasil_lama = {"valid": False, "pesan": "Silakan rekam ulang di tempat tenang."}
        self.generate.return_value = respons_ai(hasil_lama)
        self.assertEqual(services.analisis_audio(rekaman_wav(), "audio/wav"), hasil_lama)
        self.generate.assert_called_once()

    def test_bad_reason_is_not_retried_or_fabricated_into_a_neutral_analysis(self):
        self.generate.return_value = respons_ai(penolakan("kode_tidak_dikenal"))
        with self.assertRaises(ValueError) as error:
            services.analisis_audio(rekaman_wav(), "audio/wav")
        self.assertNotIsInstance(error.exception, services.InputCurhatError)
        self.generate.assert_called_once()


class AudioRejectionBackendTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="audio_rejection_user", password="Test-only-audio-927!"
        )
        self.api = APIClient()
        self.api.force_authenticate(self.user)
        self.gemini = self.enterContext(patch("api.services.client"))
        self.generate = self.gemini.models.generate_content
        self.enterContext(patch("api.views.logger.exception"))

    def upload(self):
        # Audio sintetis hanya menguji transport/parsing. Klasifikasi dimock.
        return SimpleUploadedFile("curhat.wav", rekaman_wav(), content_type="audio/wav")

    def test_specific_rejections_are_400_without_internal_fields_or_history(self):
        for kode in KODE_PENOLAKAN:
            with self.subTest(alasan=kode):
                self.generate.reset_mock()
                self.generate.return_value = respons_ai(penolakan(kode))
                response = self.api.post(
                    "/api/curhat/audio/", {"audio": self.upload()}, format="multipart"
                )
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json(), {
                    "success": False, "message": services.ALASAN_PENOLAKAN_AUDIO[kode]
                })
                self.assertFalse(RiwayatCurhat.objects.exists())
                self.generate.assert_called_once()

    def test_malformed_audio_reasons_are_502_without_saved_history(self):
        for kode in ("tidak_dikenal", None, [], "  "):
            with self.subTest(alasan=kode):
                self.generate.reset_mock()
                self.generate.return_value = respons_ai(penolakan(kode))
                response = self.api.post(
                    "/api/curhat/audio/", {"audio": self.upload()}, format="multipart"
                )
                self.assertEqual(response.status_code, 502)
                self.assertFalse(response.data["success"])
                self.assertNotIn("alasan", response.data)
                self.assertFalse(RiwayatCurhat.objects.exists())
                self.generate.assert_called_once()

    def test_accepted_personal_academic_story_still_saves_the_four_be002_fields(self):
        # Respons buatan: membuktikan penyimpanan hasil yang diterima, bukan mutu AI.
        hasil = {
            "valid": True,
            "emosi": "Tertekan",
            "ringkasan_cerita": (
                "Kamu merasa kewalahan mempersiapkan presentasi kuliah dengan tenggat dekat."
            ),
            "akar_masalah": "Beban persiapan presentasi dalam waktu terbatas.",
            "rekomendasi": (
                "Persiapan presentasi dengan tenggat dekat bisa terasa berat.\n\n"
                "1. Pilih bagian materi terpenting untuk diprioritaskan.\n\n"
                "2. Bagi persiapan menjadi langkah kecil sesuai waktu yang tersedia."
            ),
        }
        self.generate.return_value = respons_ai(hasil)
        response = self.api.post(
            "/api/curhat/audio/", {"audio": self.upload()}, format="multipart"
        )
        self.assertEqual(response.status_code, 201)
        record = RiwayatCurhat.objects.get()
        self.assertEqual(record.user_id, self.user.pk)
        self.assertEqual(bytes(record.audio_file), rekaman_wav())
        for field in services.FIELD_ANALISIS:
            self.assertEqual(response.data["data"][field], hasil[field])
            self.assertEqual(getattr(record, field), hasil[field])
        self.assertNotIn("alasan", response.data["data"])
        self.assertNotIn("valid", response.data["data"])
        self.generate.assert_called_once()
