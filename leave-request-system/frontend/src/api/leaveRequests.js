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

export function getRequests(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/leave-requests${qs ? "?" + qs : ""}`);
}

export function submitRequest(data) {
  return request("/api/leave-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function approveRequest(id) {
  return request(`/api/leave-requests/${id}/approve`, { method: "PATCH" });
}

export function rejectRequest(id) {
  return request(`/api/leave-requests/${id}/reject`, { method: "PATCH" });
}
