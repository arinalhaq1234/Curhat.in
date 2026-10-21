
import { API_URL } from "@/constants/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  console.log(
    "API RESPONSE:",
    response.status,
    data
  );

  if (!response.ok) {
    let message = "Terjadi kesalahan pada request.";

    if (data.errors?.username) {
      message = "Username sudah digunakan.";
    } else if (data.errors?.email) {
      message = "Email sudah digunakan atau tidak valid.";
    } else if (data.detail) {
      message = data.detail;
    } else if (data.message) {
      message = data.message;
    }

    throw new ApiError(
      message,
      response.status
    );
  }

  return data;
}

export async function checkHealth() {
  return apiRequest("/api/health/");
}

export async function registerUser(
  username: string,
  email: string,
  password: string
) {
  return apiRequest("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });
}

export async function loginUser(
  username: string,
  password: string
) {
  return apiRequest("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function getProfile(accessToken: string) {
  return apiRequest("/api/auth/profile/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// LOGOUT - Mengirim refresh token dan Bearer access token
export async function logoutUser(
  refreshToken: string,
  accessToken: string
) {
  return apiRequest("/api/auth/logout/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });
}

export async function sendTextCurhat(
  teks: string,
  accessToken: string
) {
  return apiRequest('/api/curhat/text/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ teks }),
  });
}
