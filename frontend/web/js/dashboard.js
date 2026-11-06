async function loadDashboard() {
    const message = document.getElementById("dashboard-message");

    try {
        message.textContent = "Memuat ringkasan dashboard...";

        const response = await fetch(
            "./data/dashboard-mock.json?v=ringkasan3"
        );

        if (!response.ok) {
            throw new Error("Data tidak dapat dimuat.");
        }

        const data = await response.json();

        const aktivitas = data.aktivitas_harian || [];
        const emosi = data.distribusi_emosi || [];
        const tren = data.tren_penggunaan || [];

        document.getElementById("jumlah-pengguna").textContent =
            Number(data.jumlah_pengguna).toLocaleString("id-ID");

        document.getElementById("jumlah-curhat").textContent =
            Number(data.jumlah_curhat).toLocaleString("id-ID");

        const terbaru = aktivitas.at(-1);

        document.getElementById("aktivitas-terbaru").textContent =
            terbaru ? terbaru.jumlah : 0;

        const dominan = [...emosi].sort(
            (a, b) => Number(b.jumlah) - Number(a.jumlah)
        )[0];

        document.getElementById("emosi-dominan").textContent =
            dominan
                ? dominan.kategori.charAt(0).toUpperCase() +
                  dominan.kategori.slice(1)
                : "—";

        const total = aktivitas.reduce(
            (sum, item) => sum + Number(item.jumlah), 0
        );

        document.getElementById("total-aktivitas").textContent =
            total.toLocaleString("id-ID");

        let perubahan = "—";

        if (tren.length >= 2) {
            const awal = Number(tren[0].jumlah_curhat);
            const akhir = Number(tren.at(-1).jumlah_curhat);
            const selisih = akhir - awal;

            perubahan = (selisih > 0 ? "+" : "") + selisih;
        }

        document.getElementById("perubahan-aktivitas").textContent =
            perubahan;

        message.textContent =
            "Ringkasan monitoring menggunakan data contoh.";

    } catch (error) {
        message.textContent =
            "Gagal memuat dashboard: " + error.message;
        console.error(error);
    }
}

loadDashboard();
