from django.urls import path
from . import views


urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    path("curhat/text/", views.curhat_text, name="curhat-text"),
    path("curhat/audio/", views.curhat_audio, name="curhat-audio"),
]