"""Akses riwayat pemilik dan batas informasi untuk admin."""

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import RiwayatCurhat


class RiwayatPrivacyTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user(username="owner")
        self.other = User.objects.create_user(username="other")
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@example.test", password="test-password"
        )
        self.private_values = (
            "TEKS_PRIVAT_987",
            "RINGKASAN_PRIVAT_987",
            "AKAR_PRIVAT_987",
            "REKOMENDASI_PRIVAT_987",
            "rekaman-privat-987.m4a",
            "AUDIO_PRIVAT_987",
        )
        self.text_record = RiwayatCurhat.objects.create(
            user=self.owner,
            teks=self.private_values[0],
            emosi="Cemas",
            ringkasan_cerita=self.private_values[1],
            akar_masalah=self.private_values[2],
            rekomendasi=self.private_values[3],
        )
        self.audio_record = RiwayatCurhat.objects.create(
            user=self.owner,
            audio_file=self.private_values[5].encode(),
            audio_name=self.private_values[4],
            emosi="Cemas",
            ringkasan_cerita=self.private_values[1],
            akar_masalah=self.private_values[2],
            rekomendasi=self.private_values[3],
        )

    @staticmethod
    def api_for(user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def assert_no_private_content(self, response):
        body = response.content.decode("utf-8")
        for private_value in self.private_values:
            with self.subTest(private_value=private_value):
                self.assertNotIn(private_value, body)
        self.assertNotIn("audio_file", body)
        self.assertNotIn("audio_url", body)

    def test_owner_can_read_own_history_but_audio_bytes_are_not_returned(self):
        client = self.api_for(self.owner)
        listing = client.get(reverse("curhat-history"))
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.data["data"]["count"], 2)
        self.assertEqual(
            {item["id"] for item in listing.data["data"]["results"]},
            {self.text_record.id, self.audio_record.id},
        )
        detail = client.get(reverse("curhat-history-detail", args=[self.text_record.id]))
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["data"]["teks"], self.private_values[0])
        self.assertEqual(detail.data["data"]["ringkasan_cerita"], self.private_values[1])
        audio_detail = client.get(reverse("curhat-history-detail", args=[self.audio_record.id]))
        self.assertEqual(audio_detail.status_code, 200)
        self.assertEqual(audio_detail.data["data"]["audio_name"], self.private_values[4])
        self.assertNotIn(self.private_values[5], audio_detail.content.decode("utf-8"))

    def test_other_user_and_non_owner_admin_cannot_read_by_id(self):
        for user in (self.other, self.admin):
            client = self.api_for(user)
            listing = client.get(reverse("curhat-history"))
            self.assertEqual(listing.status_code, 200)
            self.assertEqual(listing.data["data"]["count"], 0)
            self.assert_no_private_content(listing)
            for record in (self.text_record, self.audio_record):
                detail = client.get(reverse("curhat-history-detail", args=[record.id]))
                self.assertEqual(detail.status_code, 404)
                self.assert_no_private_content(detail)

    def test_admin_pages_and_search_show_metadata_only(self):
        client = Client()
        client.force_login(self.admin)
        list_url = reverse("admin:api_riwayatcurhat_changelist")
        for url in (
            list_url,
            f"{list_url}?q={self.text_record.id}",
            reverse("admin:api_riwayatcurhat_change", args=[self.text_record.id]),
            reverse("admin:api_riwayatcurhat_change", args=[self.audio_record.id]),
            reverse("admin:api_riwayatcurhat_history", args=[self.text_record.id]),
        ):
            with self.subTest(url=url):
                response = client.get(url)
                self.assertEqual(response.status_code, 200)
                self.assert_no_private_content(response)
        private_search = client.get(list_url, {"q": self.private_values[0]})
        self.assertEqual(private_search.status_code, 200)
        self.assertEqual(private_search.context["cl"].result_count, 0)
        self.assertNotIn(self.private_values[1], private_search.content.decode("utf-8"))
        listing = client.get(list_url)
        self.assertContains(listing, "Jenis input")
        self.assertContains(listing, "Status analisis")
        self.assertFalse(listing.context["cl"].model_admin.get_actions(listing.wsgi_request))

    def test_admin_cannot_add_edit_or_delete_private_records(self):
        client = Client()
        client.force_login(self.admin)
        change_url = reverse("admin:api_riwayatcurhat_change", args=[self.text_record.id])
        self.assertEqual(client.post(change_url, {"teks": "changed"}).status_code, 403)
        self.assertEqual(client.get(reverse("admin:api_riwayatcurhat_add")).status_code, 403)
        self.assertEqual(
            client.get(reverse("admin:api_riwayatcurhat_delete", args=[self.text_record.id])).status_code,
            403,
        )
        self.text_record.refresh_from_db()
        self.assertEqual(self.text_record.teks, self.private_values[0])

    def test_admin_statistics_still_aggregate_without_private_content(self):
        response = self.api_for(self.admin).get(reverse("admin-statistics"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["jumlah_curhat"], 2)
        self.assert_no_private_content(response)

    def test_no_direct_audio_url_is_registered(self):
        for user in (self.owner, self.other, self.admin):
            response = self.api_for(user).get(
                f"/api/curhat/history/{self.audio_record.id}/audio/"
            )
            self.assertEqual(response.status_code, 404)
            self.assert_no_private_content(response)
