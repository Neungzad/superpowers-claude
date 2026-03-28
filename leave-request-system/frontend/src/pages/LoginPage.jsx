import { useState } from "react";
import { login } from "../api/auth.js";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F4EF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "48px 40px",
          width: 380,
          boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Leave<span style={{ color: "#C8721A" }}>.</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#9A948C",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          Internal Time-Off Portal
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={inputStyle}
              data-testid="email-input"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
              data-testid="password-input"
            />
          </div>

          {error && (
            <div
              data-testid="login-error"
              style={{
                fontSize: 13,
                color: "#991B1B",
                textAlign: "center",
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="login-button"
            style={{
              width: "100%",
              height: 48,
              background: "#1A1814",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#4A4540",
  marginBottom: 6,
};
const inputStyle = {
  width: "100%",
  height: 46,
  border: "1.5px solid rgba(26,24,20,0.1)",
  borderRadius: 10,
  padding: "0 14px",
  fontSize: 14,
  background: "#F7F4EF",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
