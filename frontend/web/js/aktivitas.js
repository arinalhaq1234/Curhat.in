let activityChart = null;
let activityData = [];

const message = document.getElementById("dashboard-message");

function renderActivity(start, end) {
    if (!start || !end || start > end) {
        message.textContent = "Tanggal awal dan akhir harus valid.";
        return;
    }

    const filtered = activityData.filter(item =>
        item.tanggal >= start && item.tanggal <= end
    );

    const total = filtered.reduce(
        (sum, item) => sum + item.jumlah, 0
    );

    const average = filtered.length
        ? (total / filtered.length).toFixed(1)
        : 0;

    const peak = filtered.length
        ? Math.max(...filtered.map(item => item.jumlah))
        : 0;

    document.getElementById("total-aktivitas").textContent = total;
    document.getElementById("rata-aktivitas").textContent = average;
    document.getElementById("puncak-aktivitas").textContent = peak;

    if (activityChart) {
        activityChart.destroy();
        activityChart = null;
    }

    const canvas = document.getElementById("activity-chart");

    if (filtered.length === 0) {
        canvas.style.display = "none";
        message.textContent = "Tidak ada data aktivitas pada periode ini.";
        return;
    }

    if (typeof Chart === "undefined") {
        message.textContent = "Gagal memuat library Chart.js.";
        return;
    }

    canvas.style.display = "block";

    activityChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: filtered.map(item => item.tanggal),
            datasets: [{
                label: "Jumlah Curhat",
                data: filtered.map(item => item.jumlah),
                backgroundColor: "#8B70C2",
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });

    message.textContent = "Menampilkan aktivitas harian menggunakan data backend.";
}

async function loadActivity() {
    try {
        await window.curhatAdminAuthReady;

        if (document.body.style.visibility !== "visible") {
            return;
        }

        const start = document.getElementById("filter-start").value;
        const end = document.getElementById("filter-end").value;

        if (!start || !end || start > end) {
            message.textContent = "Tanggal awal dan akhir harus valid.";
            return;
        }

        const token = sessionStorage.getItem("curhat_admin_access");
        const baseURL = window.CURHAT_CONFIG?.API_BASE_URL;

        if (!token || !baseURL) {
            window.location.replace("./login.html");
            return;
        }

        message.textContent = "Memuat aktivitas harian...";

        const params = new URLSearchParams({
            start_date: start,
            end_date: end
        });

        const response = await fetch(
            baseURL + "admin/statistics/?" + params.toString(),
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                },
                cache: "no-store"
            }
        );

        if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem("curhat_admin_access");
            sessionStorage.removeItem("curhat_admin_refresh");
            window.location.replace("./login.html");
            return;
        }

        if (!response.ok) {
            throw new Error("Data aktivitas tidak dapat dimuat.");
        }

        const data = await response.json();

        if (!Array.isArray(data.aktivitas_harian)) {
            throw new Error("Format aktivitas harian tidak valid.");
        }

        activityData = data.aktivitas_harian;

        renderActivity(start, end);

    } catch (error) {
        message.textContent = "Gagal memuat aktivitas: " + error.message;
        console.error(error);
    }
}
document.getElementById("apply-filter").addEventListener("click", loadActivity);

loadActivity();
