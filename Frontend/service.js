// API layer: talks to the ASP.NET backend and manages the session token.
const API_BASE = "http://localhost:5229";
const TOKEN_KEY = "ccc_session_token";

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function isLoggedIn() {
  return Boolean(getToken());
}

async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Incorrect username or password."
        : "Login failed. Please try again."
    );
  }

  const { token } = await response.json();
  sessionStorage.setItem(TOKEN_KEY, token);
}

async function logout() {
  const token = getToken();
  sessionStorage.removeItem(TOKEN_KEY);
  if (!token) return;

  try {
    await fetch(`${API_BASE}/api/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Token is already cleared locally; server cleanup is best-effort.
  }
}

async function fetchInventory() {
  const response = await fetch(`${API_BASE}/api/inventory`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (response.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    throw new Error("Session expired. Please log in again.");
  }
  if (!response.ok) {
    throw new Error("Could not load inventory.");
  }

  return response.json();
}
