from django.urls import path
from . import views


urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    path("curhat/text/", views.curhat_text, name="curhat-text"),
    path("curhat/audio/", views.curhat_audio, name="curhat-audio"),
    path("curhat/history/", views.curhat_history, name="curhat-history"),
    path("curhat/history/<int:curhat_id>/", views.curhat_history_detail, name="curhat-history-detail"),

    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login_user, name="login"),
    path("auth/profile/", views.profile, name="profile"),
    path("auth/logout/", views.logout_user, name="logout"),
    path("auth/admin-check/", views.admin_check, name="admin-check"),
]