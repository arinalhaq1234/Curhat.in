"use strict";

(async function protectAdminPage() {
    document.body.style.visibility = "hidden";

    const access = sessionStorage.getItem("curhat_admin_access");
    const refresh = sessionStorage.getItem("curhat_admin_refresh");
    const baseURL = window.CURHAT_CONFIG?.API_BASE_URL;

    function clearSession() {
        sessionStorage.removeItem("curhat_admin_access");
        sessionStorage.removeItem("curhat_admin_refresh");
    }

    function redirectToLogin() {
        clearSession();
        window.location.replace("./login.html");
    }

    if (!access || !refresh || !baseURL) {
        redirectToLogin();
        return;
    }

    try {
        const response = await fetch(
            baseURL + "auth/admin-check/",
            {
                headers: {
                    "Authorization": "Bearer " + access
                },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            redirectToLogin();
            return;
        }

        // Tampilkan dashboard setelah sesi diverifikasi.
        document.body.style.visibility = "visible";

        const navigation = document.querySelector(".sidebar-nav");

        if (navigation) {
            const logoutButton = document.createElement("button");

            logoutButton.type = "button";
            logoutButton.className = "sidebar-logout";
            logoutButton.textContent = "Keluar";

            Object.assign(logoutButton.style, {
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
                border: "none"
            });

            logoutButton.addEventListener("click", async () => {
                logoutButton.disabled = true;
                logoutButton.textContent = "Keluar...";

                try {
                    await fetch(baseURL + "auth/logout/", {
                        method: "POST",
                        headers: {
                            "Authorization": "Bearer " + access,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ refresh }),
                        keepalive: true
                    });
                } catch (error) {
                    console.error("Permintaan logout gagal:", error);
                } finally {
                    // Sesi browser tetap dibersihkan walaupun backend
                    // gagal menerima permintaan logout.
                    redirectToLogin();
                }
            });

            navigation.appendChild(logoutButton);
        }

    } catch (error) {
        console.error("Gagal memverifikasi sesi:", error);
        redirectToLogin();
    }
})();
