let trendChart = null;
let trendData = [];

const message = document.getElementById("dashboard-message");

function renderTrend(start, end) {
    if (!start || !end || start > end) {
        message.textContent = "Tanggal awal dan akhir tidak valid.";
        return;
    }

    const filtered = trendData.filter(item =>
        item.tanggal >= start && item.tanggal <= end
    );

    const values = filtered.map(item => Number(item.jumlah_curhat));

    const total = values.reduce((sum, value) => sum + value, 0);
    const peak = values.length ? Math.max(...values) : 0;

    let change = "—";

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

    if (!filtered.length) {
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
                pointRadius: 5
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

    message.textContent = "Menampilkan data contoh tren penggunaan.";
}

async function loadTrend() {
    try {
        message.textContent = "Memuat data tren waktu...";

        const response = await fetch("./data/dashboard-mock.json");

        if (!response.ok) {
            throw new Error("Data tren tidak dapat dimuat.");
        }

        const data = await response.json();

        if (!Array.isArray(data.tren_penggunaan)) {
            throw new Error("Format data tren tidak valid.");
        }

        trendData = data.tren_penggunaan;

        renderTrend(
            document.getElementById("filter-start").value,
            document.getElementById("filter-end").value
        );

    } catch (error) {
        message.textContent = "Gagal memuat tren: " + error.message;
        console.error(error);
    }
}

document.getElementById("apply-filter").addEventListener("click", () => {
    renderTrend(
        document.getElementById("filter-start").value,
        document.getElementById("filter-end").value
    );
});

loadTrend();
