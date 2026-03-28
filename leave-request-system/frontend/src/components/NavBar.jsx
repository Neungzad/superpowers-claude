import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth.js";

export default function NavBar({ user, onLogout }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout().catch(() => {});
    onLogout();
    navigate("/login", { replace: true });
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        height: 56,
        background: "#1A1814",
        gap: 8,
      }}
    >
      <span
        style={{
          color: "white",
          fontWeight: 700,
          marginRight: "auto",
          fontSize: 18,
        }}
      >
        Leave<span style={{ color: "#C8721A" }}>.</span>
      </span>
      <Link
        to="/dashboard"
        style={{
          color: "rgba(255,255,255,0.7)",
          textDecoration: "none",
          padding: "0 12px",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Dashboard
      </Link>
      {user.role === "manager" && (
        <Link
          to="/manager"
          style={{
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            padding: "0 12px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Manager
        </Link>
      )}
      <span
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          paddingLeft: 16,
          borderLeft: "1px solid rgba(255,255,255,0.15)",
          marginLeft: 8,
        }}
      >
        {user.name} · {user.role}
      </span>
      <button
        onClick={handleLogout}
        style={{
          marginLeft: 12,
          padding: "6px 14px",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.6)",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Logout
      </button>
    </nav>
  );
}
