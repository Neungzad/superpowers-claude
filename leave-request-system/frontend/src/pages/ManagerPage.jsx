import { useState, useEffect, useCallback } from "react";
import NavBar from "../components/NavBar.jsx";
import LeaveRequestTable from "../components/LeaveRequestTable.jsx";
import { getRequests } from "../api/leaveRequests.js";

export default function ManagerPage({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("pending");

  const loadData = useCallback(async () => {
    const params = tab === "pending" ? { status: "PENDING" } : {};
    const data = await getRequests(params);
    setRequests(data);
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F4EF" }}>
      <NavBar user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #EDE9E2",
            marginBottom: 24,
          }}
        >
          {["pending", "all"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`tab-${t}`}
              style={{
                padding: "0 0 14px",
                marginRight: 28,
                background: "none",
                border: "none",
                borderBottom:
                  tab === t ? "2px solid #1A1814" : "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: tab === t ? "#1A1814" : "#9A948C",
              }}
            >
              {t === "pending" ? "Pending" : "All Requests"}
            </button>
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: "8px 16px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          <LeaveRequestTable
            requests={requests}
            isManager={true}
            onAction={loadData}
          />
        </div>
      </div>
    </div>
  );
}
