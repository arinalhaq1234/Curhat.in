async function loadDashboard() {
    const content = document.querySelector(".dashboard-content");
    const message = document.createElement("p");

    message.id = "dashboard-message";
    message.setAttribute("role", "status");
    message.textContent = "Memuat data contoh dashboard...";
    content.prepend(message);

    try {
        const response = await fetch("./data/dashboard-mock.json");

        if (!response.ok) {
            throw new Error("Data tidak dapat dimuat.");
        }

        const data = await response.json();

        // Kartu statistik
        const values = document.querySelectorAll(".stat-card .stat-value");

        values[0].textContent = data.jumlah_pengguna.toLocaleString("id-ID");
        values[1].textContent = data.jumlah_curhat.toLocaleString("id-ID");

        const lastActivity = data.aktivitas_harian.at(-1);
        values[2].textContent = lastActivity ? lastActivity.jumlah : 0;

        // Pastikan Chart.js sudah tersedia
        if (typeof Chart === "undefined") {
            throw new Error("Library Chart.js belum berhasil dimuat.");
        }

        // Grafik distribusi emosi
        new Chart(document.getElementById("emotion-chart"), {
            type: "doughnut",
            data: {
                labels: data.distribusi_emosi.map(item => item.kategori),
                datasets: [{
                    data: data.distribusi_emosi.map(item => item.jumlah),
                    backgroundColor: [
                        "#8164C7",
                        "#E89AB8",
                        "#F0BA77",
                        "#D97991",
                        "#A49AE3",
                        "#70B7B1",
                        "#B7BAC8"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });

        // Grafik tren penggunaan
        new Chart(document.getElementById("trend-chart"), {
            type: "line",
            data: {
                labels: data.tren_penggunaan.map(item => item.tanggal),
                datasets: [{
                    label: "Jumlah Curhat",
                    data: data.tren_penggunaan.map(item => item.jumlah_curhat),
                    borderColor: "#8164C7",
                    backgroundColor: "rgba(129,100,199,0.15)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

        message.textContent = "Pratinjau dashboard menggunakan data contoh.";

    } catch (error) {
        message.textContent = "Gagal memuat dashboard: " + error.message;
        console.error(error);
    }
}

loadDashboard();

/* Filter tanggal untuk pratinjau data contoh */
document.getElementById("apply-filter").addEventListener("click", async () => {
    const start = document.getElementById("filter-start").value;
    const end = document.getElementById("filter-end").value;
    const message = document.getElementById("dashboard-message");

    if (!start || !end || start > end) {
        message.textContent = "Tanggal awal dan akhir harus valid.";
        return;
    }

    try {
        message.textContent = "Memuat data periode yang dipilih...";

        const response = await fetch("./data/dashboard-mock.json");

        if (!response.ok) {
            throw new Error("Data contoh tidak dapat dimuat.");
        }

        const data = await response.json();

        const aktivitas = data.aktivitas_harian.filter(item =>
            item.tanggal >= start && item.tanggal <= end
        );

        const tren = data.tren_penggunaan.filter(item =>
            item.tanggal >= start && item.tanggal <= end
        );

        const chart = Chart.getChart("trend-chart");

        if (!chart) {
            throw new Error("Grafik tren belum tersedia.");
        }

        chart.data.labels = tren.map(item => item.tanggal);
        chart.data.datasets[0].data =
            tren.map(item => item.jumlah_curhat);

        chart.update();

        const values = document.querySelectorAll(".stat-card .stat-value");
        values[2].textContent = aktivitas.length
            ? aktivitas[aktivitas.length - 1].jumlah
            : "0";

        const emotionCanvas = document.getElementById("emotion-chart");
        const emotionPanel = document.querySelector("#distribusi .chart-container");

        let note = document.getElementById("emotion-filter-note");

        if (!note) {
            note = document.createElement("p");
            note.id = "emotion-filter-note";
            emotionPanel.appendChild(note);
        }

        const fullRange = start <= "2026-10-16" && end >= "2026-10-22";

        emotionCanvas.style.display = fullRange ? "block" : "none";
        note.style.display = fullRange ? "none" : "block";
        note.textContent =
            "Distribusi emosi per tanggal belum tersedia pada data contoh.";

        if (fullRange) {
            Chart.getChart("emotion-chart")?.resize();
        }

        message.textContent = aktivitas.length
            ? "Menampilkan data contoh periode " + start + " sampai " + end + "."
            : "Tidak ada data aktivitas pada periode yang dipilih.";

    } catch (error) {
        message.textContent = "Gagal menerapkan filter: " + error.message;
        console.error(error);
    }
});
