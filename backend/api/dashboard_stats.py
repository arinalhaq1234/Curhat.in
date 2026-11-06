
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.db.models.functions import TruncDate, Lower, Trim

from .models import RiwayatCurhat


def hitung_statistik_dashboard(tanggal_awal=None, tanggal_akhir=None):
    User = get_user_model()

    # 1. Jumlah pengguna aplikasi (tidak termasuk admin)
    jumlah_pengguna = User.objects.filter(
        is_staff=False,
        is_superuser=False
    ).count()

    # 2. Total seluruh curhat
    jumlah_curhat = RiwayatCurhat.objects.count()

    # 3. Data curhat untuk statistik berdasarkan periode
    queryset = RiwayatCurhat.objects.all()

    if tanggal_awal is not None:
        queryset = queryset.filter(waktu__date__gte=tanggal_awal)

    if tanggal_akhir is not None:
        queryset = queryset.filter(waktu__date__lte=tanggal_akhir)

    # 4. Aktivitas curhat harian
    data_harian = list(
        queryset
        .annotate(tanggal=TruncDate("waktu"))
        .values("tanggal")
        .annotate(jumlah=Count("id"))
        .order_by("tanggal")
    )

    aktivitas_harian = [
        {
            "tanggal": item["tanggal"].isoformat(),
            "jumlah": item["jumlah"]
        }
        for item in data_harian
    ]

    # 5. Distribusi kategori emosi
    data_emosi = (
        queryset
        .annotate(kategori=Lower(Trim("emosi")))
        .exclude(kategori__isnull=True)
        .exclude(kategori="")
        .values("kategori")
        .annotate(jumlah=Count("id"))
        .order_by("kategori")
    )

    distribusi_emosi = list(data_emosi)

    # 6. Tren penggunaan berdasarkan tanggal
    tren_penggunaan = [
        {
            "tanggal": item["tanggal"],
            "jumlah_curhat": item["jumlah"]
        }
        for item in aktivitas_harian
    ]

    return {
        "jumlah_pengguna": jumlah_pengguna,
        "jumlah_curhat": jumlah_curhat,
        "aktivitas_harian": aktivitas_harian,
        "distribusi_emosi": distribusi_emosi,
        "tren_penggunaan": tren_penggunaan
    }
