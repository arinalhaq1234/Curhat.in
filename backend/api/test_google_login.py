"""BE-007: verifikasi JWT sungguhan dengan kunci uji, tanpa jaringan Google."""

import time
from unittest.mock import patch

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from google.auth import crypt, jwt
from google.auth.exceptions import TransportError
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import GoogleIdentity


@override_settings(GOOGLE_CLIENT_ID="mobile-test.apps.googleusercontent.com")
class GoogleLoginTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        private = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                    serialization.NoEncryption())
        cls.public = key.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()
        cls.signer = crypt.RSASigner.from_string(private, key_id="test-key")

    def setUp(self):
        self.client = APIClient()
        self.certs = patch("google.oauth2.id_token._fetch_certs", return_value={"test-key": self.public})
        self.certs.start()
        self.addCleanup(self.certs.stop)

    def token(self, **changes):
        now = int(time.time())
        claims = {"sub": "google-sub-1", "email": "person@gmail.com", "email_verified": True,
                  "iss": "https://accounts.google.com", "aud": "mobile-test.apps.googleusercontent.com",
                  "iat": now - 10, "exp": now + 600}
        claims.update(changes)
        return jwt.encode(self.signer, claims).decode()

    def request_google(self, action, token=None, **extra):
        return self.client.post(
            f"/api/auth/google/{action}/", {"id_token": token if token is not None else self.token(), **extra},
            format="json",
        )

    def register(self, token=None, **extra):
        return self.request_google("register", token, **extra)

    def login(self, token=None, **extra):
        return self.request_google("login", token, **extra)

    def test_new_account_tokens_profile_and_no_admin_access(self):
        response = self.register(email="attacker@example.com", user_id=1, is_staff=True, is_superuser=True)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(set(response.data), {"success", "message", "data"})
        data = response.data["data"]
        self.assertEqual(set(data), {"access", "refresh", "user"})
        user = get_user_model().objects.get(pk=data["user"]["id"])
        self.assertEqual(user.email, "person@gmail.com")
        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff or user.is_superuser)
        self.assertEqual(str(RefreshToken(data["refresh"])["user_id"]), str(user.pk))
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + data["access"])
        self.assertEqual(self.client.get("/api/auth/profile/").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/admin-check/").status_code, 403)
        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": data["refresh"]}).status_code, 200)

    def test_register_existing_identity_rejected_with_login_hint(self):
        first = self.register().data["data"]["user"]["id"]
        response = self.register()
        self.assertEqual(response.status_code, 409)
        self.assertIn("halaman Login", response.data["message"])
        self.assertEqual(get_user_model().objects.count(), 1)
        self.assertEqual(GoogleIdentity.objects.get().user_id, first)

    def test_existing_identity_uses_subject_not_changed_email(self):
        first = self.register().data["data"]["user"]["id"]
        second = self.login(self.token(email="changed@gmail.com"))
        self.assertEqual(second.status_code, 200)
        self.assertTrue(second.data["success"])
        self.assertEqual(set(second.data["data"]), {"access", "refresh", "user"})
        self.assertEqual(second.data["data"]["user"]["id"], first)
        self.assertEqual(str(RefreshToken(second.data["data"]["refresh"])["user_id"]), str(first))
        self.assertEqual(get_user_model().objects.count(), 1)
        self.assertEqual(GoogleIdentity.objects.count(), 1)

    def test_old_google_endpoint_is_not_available(self):
        response = self.client.post("/api/auth/google/", {"id_token": self.token()}, format="json")
        self.assertEqual(response.status_code, 404)
        self.assertFalse(get_user_model().objects.exists())

    def test_login_unregistered_rejected_without_creating_account(self):
        response = self.login()
        self.assertEqual(response.status_code, 404)
        self.assertIn("mendaftar", response.data["message"])
        self.assertFalse(get_user_model().objects.exists())
        self.assertFalse(GoogleIdentity.objects.exists())

    def test_missing_or_wrong_type_token(self):
        for action in ("register", "login"):
            for body in ({}, {"id_token": ""}, {"id_token": 12}, {"id_token": " "}, []):
                with self.subTest(action=action, body=body):
                    self.assertEqual(self.client.post(f"/api/auth/google/{action}/", body, format="json").status_code, 400)
        self.assertFalse(GoogleIdentity.objects.exists())

    def test_invalid_tokens(self):
        valid = self.token()
        head, payload, signature = valid.split(".")
        tampered = head + "." + payload + "." + ("A" if signature[0] != "A" else "B") + signature[1:]
        for action in (self.register, self.login):
            for token in ("broken", tampered, self.token(exp=int(time.time()) - 60, iat=int(time.time()) - 120),
                          self.token(aud="other-client"), self.token(iss="https://attacker.example"),
                          self.token(email_verified=False), self.token(sub=""), self.token(email="invalid")):
                with self.subTest(action=action.__name__, token_kind=token[:12]):
                    response = action(token)
                    self.assertEqual(response.status_code, 401)
                    self.assertNotIn("data", response.data)
        self.assertFalse(get_user_model().objects.exists())

    def test_email_conflict_never_links_existing_account(self):
        user = get_user_model().objects.create_user("existing", "PERSON@gmail.com", "password123")
        response = self.register()
        self.assertEqual(response.status_code, 409)
        self.assertFalse(GoogleIdentity.objects.exists())
        self.assertEqual(get_user_model().objects.count(), 1)
        user.refresh_from_db()
        self.assertTrue(user.check_password("password123"))

    def test_different_subject_same_email_rejected(self):
        self.register()
        self.assertEqual(self.register(self.token(sub="another-sub")).status_code, 409)
        self.assertEqual(GoogleIdentity.objects.count(), 1)

    def test_privileged_or_inactive_linked_account_rejected(self):
        self.register()
        user = GoogleIdentity.objects.get().user
        for field, value in (("is_staff", True), ("is_superuser", True), ("is_active", False)):
            with self.subTest(field=field):
                user.is_staff = user.is_superuser = False
                user.is_active = True
                setattr(user, field, value)
                user.save()
                self.assertEqual(self.login().status_code, 403)
                self.assertEqual(self.register().status_code, 403)

    @override_settings(GOOGLE_CLIENT_ID="")
    def test_missing_configuration_fails_closed(self):
        self.assertEqual(self.register().status_code, 503)
        self.assertEqual(self.login().status_code, 503)
        self.assertFalse(GoogleIdentity.objects.exists())

    def test_verification_unavailable(self):
        with patch("google.oauth2.id_token._fetch_certs", side_effect=TransportError("private detail")):
            for action in (self.register, self.login):
                response = action()
                self.assertEqual(response.status_code, 503)
                self.assertNotIn("private detail", str(response.data))

    def test_password_login_contract_unchanged(self):
        get_user_model().objects.create_user("ordinary", "ordinary@example.com", "password123")
        old = self.client.post("/api/auth/login/", {"username": "ordinary", "password": "password123"})
        new = self.register()
        self.assertEqual(old.status_code, 200)
        self.assertEqual(set(old.data["data"]), set(new.data["data"]))
        self.assertEqual(set(old.data["data"]["user"]), set(new.data["data"]["user"]))
