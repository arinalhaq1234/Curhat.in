
"use strict";

// WEB-001 Tahap 1
// Pemeriksaan awal konfigurasi dashboard Curhat.in.

document.addEventListener("DOMContentLoaded", function () {
    const statusElement = document.getElementById("status-aplikasi");

    // Memeriksa konfigurasi backend
    const konfigurasiSiap =
        typeof window.CURHAT_CONFIG !== "undefined" &&
        typeof window.CURHAT_CONFIG.API_BASE_URL === "string";

    // Memeriksa library Chart.js
    const chartSiap = typeof window.Chart !== "undefined";

    if (!statusElement) {
        console.error("Elemen status-aplikasi tidak ditemukan.");
        return;
    }

    if (!konfigurasiSiap) {
        statusElement.textContent =
            "Gagal memuat konfigurasi backend.";

        console.error("config.js belum berhasil dimuat.");
        return;
    }

    if (!chartSiap) {
        statusElement.textContent =
            "Konfigurasi siap, tetapi Chart.js belum berhasil dimuat.";

        console.error("Library Chart.js belum tersedia.");
        return;
    }

    statusElement.textContent =
        "Dashboard siap dikembangkan. Konfigurasi dan Chart.js berhasil dimuat.";

    console.log("Curhat.in Dashboard berhasil dijalankan.");
    console.log(
        "Backend API:",
        window.CURHAT_CONFIG.API_BASE_URL
    );
    console.log("Chart.js tersedia:", chartSiap);
});
