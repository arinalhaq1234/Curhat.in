const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");

function showMessage(text, isError = false) {
    loginMessage.textContent = text;
    loginMessage.style.color = isError ? "#B42318" : "#5B3D91";
}

function setLoading(loading) {
    loginButton.disabled = loading;
    usernameInput.disabled = loading;
    passwordInput.disabled = loading;
    loginButton.textContent = loading ? "Memproses..." : "Masuk";
    loginForm.setAttribute("aria-busy", String(loading));
}

loginForm.addEventListener("submit", async (event) => {
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

    // Simulasi status request untuk pengujian Tahap 1.
    // Tidak ada kredensial yang dikirim atau disimpan.
    setLoading(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 600));

        showMessage(
            "Form valid. Koneksi autentikasi backend belum diaktifkan."
        );
    } catch (error) {
        showMessage(
            "Terjadi kesalahan. Silakan coba lagi.",
            true
        );
    } finally {
        setLoading(false);
    }
});
