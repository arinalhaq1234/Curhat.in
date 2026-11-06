"use strict";

const form = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const message = document.getElementById("login-message");

function showMessage(text, error = false) {
    message.textContent = text;
    message.style.color = error ? "#B42318" : "#5B3D91";
}

function setLoading(loading) {
    loginButton.disabled = loading;
    usernameInput.disabled = loading;
    passwordInput.disabled = loading;
    loginButton.textContent = loading ? "Memproses..." : "Masuk";
    form.setAttribute("aria-busy", String(loading));
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    showMessage("");

    if (!username) {
        showMessage("Username wajib diisi.", true);
        usernameInput.focus();
        return;
    }

    if (!password.trim()) {
        showMessage("Password wajib diisi.", true);
        passwordInput.focus();
        return;
    }

    setLoading(true);

    try {
        const baseURL = window.CURHAT_CONFIG.API_BASE_URL;

        const response = await fetch(baseURL + "auth/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Username atau password salah."
            );
        }

        const access = result.data?.access;
        const refresh = result.data?.refresh;

        if (!access || !refresh) {
            throw new Error("Token login tidak tersedia.");
        }

        // Jangan percaya role dari frontend saja.
        // Verifikasi langsung melalui endpoint yang hanya mengizinkan admin.
        const adminResponse = await fetch(
            baseURL + "auth/admin-check/",
            {
                headers: {
                    "Authorization": "Bearer " + access
                }
            }
        );

        if (!adminResponse.ok) {
            if (adminResponse.status === 403) {
                throw new Error(
                    "Akun ini tidak memiliki akses admin."
                );
            }

            throw new Error(
                "Verifikasi hak akses admin gagal."
            );
        }

        sessionStorage.setItem("curhat_admin_access", access);
        sessionStorage.setItem("curhat_admin_refresh", refresh);

        passwordInput.value = "";
        showMessage("Login berhasil. Mengarahkan ke dashboard...");

        window.location.replace("./dashboard.html");

    } catch (error) {
        showMessage(
            error instanceof TypeError
                ? "Tidak dapat terhubung ke backend. Periksa server Django."
                : error.message,
            true
        );
    } finally {
        setLoading(false);
    }
});
