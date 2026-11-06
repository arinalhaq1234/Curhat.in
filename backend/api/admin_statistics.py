
import re
from datetime import date


from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .dashboard_stats import hitung_statistik_dashboard


def parse_tanggal(value):
    if value is None:
        return None

    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("Format tanggal harus YYYY-MM-DD.")

    return date.fromisoformat(value)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_statistics(request):
    try:
        tanggal_awal = parse_tanggal(
            request.query_params.get("start_date")
        )
        tanggal_akhir = parse_tanggal(
            request.query_params.get("end_date")
        )

    except ValueError:
        return Response(
            {
                "success": False,
                "message": (
                    "Tanggal tidak valid. "
                    "Gunakan format YYYY-MM-DD."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if (
        tanggal_awal is not None
        and tanggal_akhir is not None
        and tanggal_awal > tanggal_akhir
    ):
        return Response(
            {
                "success": False,
                "message": (
                    "Tanggal awal tidak boleh "
                    "melebihi tanggal akhir."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    data = hitung_statistik_dashboard(
        tanggal_awal=tanggal_awal,
        tanggal_akhir=tanggal_akhir
    )

    return Response(data, status=status.HTTP_200_OK)
