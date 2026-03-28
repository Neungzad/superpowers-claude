async function request(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (typeof body.error === 'string' && body.error) || body.message || body.statusMessage || "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export function me() {
  return request("/api/auth/me").then((r) => r.user);
}
