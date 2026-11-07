async function loadEmotion() {
    const message = document.getElementById("dashboard-message");
    const summary = document.getElementById("emotion-summary");

    try {
        message.textContent = "Memuat distribusi emosi...";

        await window.curhatAdminAuthReady;

// Jangan mengambil statistik jika sesi admin tidak valid.
if (document.body.style.visibility !== "visible") {
    return;
}

const token = sessionStorage.getItem("curhat_admin_access");
const baseURL = window.CURHAT_CONFIG?.API_BASE_URL;

if (!token || !baseURL) {
    window.location.replace("./login.html");
    return;
}

const response = await fetch(baseURL + "admin/statistics/", {
    method: "GET",
    headers: {
        "Authorization": "Bearer " + token
    },
    cache: "no-store"
});

if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem("curhat_admin_access");
    sessionStorage.removeItem("curhat_admin_refresh");
    window.location.replace("./login.html");
    return;
}

        if (!response.ok) {
            throw new Error("Data emosi tidak dapat dimuat.");
        }

        const data = await response.json();
        const emotions = data.distribusi_emosi;

        if (!Array.isArray(emotions) || emotions.length === 0) {
            message.textContent = "Belum ada data emosi.";
            return;
        }

        if (typeof Chart === "undefined") {
            throw new Error("Chart.js belum tersedia.");
        }

        const colors = {
            cemas: "#8164C7",
            sedih: "#E89AB8",
            takut: "#F0BA77",
            marah: "#D97991",
            tertekan: "#A49AE3",
            kesepian: "#70B7B1",
            netral: "#B7BAC8",
            bahagia: "#F49B59"
        };

        const total = emotions.reduce(
            (sum, item) => sum + Number(item.jumlah), 0
        );

        if (total === 0) {
            message.textContent = "Belum ada data emosi.";
            return;
        }

        new Chart(document.getElementById("emotion-chart"), {
            type: "doughnut",
            data: {
                labels: emotions.map(item => item.kategori),
                datasets: [{
                    data: emotions.map(item => item.jumlah),
                    backgroundColor: emotions.map(
                        item => colors[item.kategori] || "#CCCCCC"
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });

        emotions.forEach(item => {
            const card = document.createElement("article");
            card.className = "stat-card";
            card.style.borderTopColor =
                colors[item.kategori] || "#CCCCCC";

            const name = document.createElement("h3");
            name.textContent =
                item.kategori.charAt(0).toUpperCase() +
                item.kategori.slice(1);

            const value = document.createElement("p");
            value.className = "stat-value";
            value.textContent = item.jumlah;

            const detail = document.createElement("p");
            detail.className = "stat-description";
            detail.textContent =
                ((item.jumlah / total) * 100).toFixed(1) +
                "% dari seluruh data emosi";

            card.append(name, value, detail);
            summary.appendChild(card);
        });

        message.textContent =
            "Distribusi emosi menggunakan data backend.";

    } catch (error) {
        message.textContent =
            "Gagal memuat distribusi emosi: " + error.message;
        console.error(error);
    }
}

loadEmotion();

