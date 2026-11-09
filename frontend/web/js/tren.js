let trendChart = null;
let trendData = [];

const message = document.getElementById("dashboard-message");

function renderTrend(start, end) {
    if (!start || !end || start > end) {
        message.textContent = "Tanggal awal dan akhir tidak valid.";
        return;
    }

    const countsByDate = new Map(
        trendData.map(item => [
            item.tanggal,
            Number(item.jumlah_curhat)
        ])
    );

    const filtered = [];
    const currentDate = new Date(start + "T00:00:00Z");
    const endDate = new Date(end + "T00:00:00Z");

    while (currentDate <= endDate) {
        const date = currentDate.toISOString().slice(0, 10);

        filtered.push({
            tanggal: date,
            jumlah_curhat: countsByDate.get(date) ?? 0
        });

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    const values = filtered.map(item => Number(item.jumlah_curhat));

    const total = values.reduce((sum, value) => sum + value, 0);
    const peak = values.length ? Math.max(...values) : 0;

    let change = "-";

    if (values.length >= 2) {
        const difference = values[values.length - 1] - values[0];
        change = (difference > 0 ? "+" : "") + difference;
    }

    document.getElementById("total-tren").textContent = total;
    document.getElementById("perubahan-tren").textContent = change;
    document.getElementById("puncak-tren").textContent = peak;

    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }

    const canvas = document.getElementById("trend-chart");

    if (total === 0) {
        canvas.style.display = "none";
        message.textContent = "Tidak ada data tren pada periode ini.";
        return;
    }

    if (typeof Chart === "undefined") {
        message.textContent = "Gagal memuat Chart.js.";
        return;
    }

    canvas.style.display = "block";

    trendChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: filtered.map(item => item.tanggal),
            datasets: [{
                label: "Jumlah Curhat",
                data: values,
                borderColor: "#8164C7",
                backgroundColor: "rgba(129,100,199,0.15)",
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: values.map(value =>
                    value === 0 ? "#9CA3AF" : "#8164C7"
                ),
                pointBorderColor: values.map(value =>
                    value === 0 ? "#9CA3AF" : "#8164C7"
                )
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

    message.textContent = "Menampilkan tren waktu menggunakan data backend.";
}

async function loadTrend() {
    try {
        await window.curhatAdminAuthReady;

        if (document.body.style.visibility !== "visible") {
            return;
        }

        const start = document.getElementById("filter-start").value;
        const end = document.getElementById("filter-end").value;

        if (!start || !end || start > end) {
            message.textContent = "Tanggal awal dan akhir tidak valid.";
            return;
        }

        const token = sessionStorage.getItem("curhat_admin_access");
        const baseURL = window.CURHAT_CONFIG?.API_BASE_URL;

        if (!token || !baseURL) {
            window.location.replace("./login.html");
            return;
        }

        message.textContent = "Memuat data tren waktu...";

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
            throw new Error("Data tren tidak dapat dimuat.");
        }

        const data = await response.json();

        if (!Array.isArray(data.tren_penggunaan)) {
            throw new Error("Format data tren tidak valid.");
        }

        trendData = data.tren_penggunaan;

        renderTrend(start, end);

    } catch (error) {
        message.textContent = "Gagal memuat tren: " + error.message;
        console.error(error);
    }
}
document.getElementById("apply-filter").addEventListener("click", loadTrend);

loadTrend();
