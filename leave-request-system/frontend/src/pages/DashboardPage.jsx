import { useState, useEffect, useCallback } from "react";
import NavBar from "../components/NavBar.jsx";
import LeaveBalanceCard from "../components/LeaveBalanceCard.jsx";
import LeaveRequestTable from "../components/LeaveRequestTable.jsx";
import SubmitLeaveModal from "../components/SubmitLeaveModal.jsx";
import { getBalances } from "../api/leaveBalances.js";
import { getRequests } from "../api/leaveRequests.js";

export default function DashboardPage({ user, onLogout }) {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    const [bal, req] = await Promise.all([getBalances(), getRequests()]);
    setBalances(bal);
    setRequests(req);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleModalSuccess() {
    setShowModal(false);
    loadData();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F4EF" }}>
      <NavBar user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#9A948C",
            marginBottom: 16,
          }}
        >
          Leave Balances — {new Date().getFullYear()}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {balances.map((b) => (
            <LeaveBalanceCard key={b.leaveType} {...b} />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#9A948C",
              margin: 0,
            }}
          >
            My Recent Requests
          </h2>
          <button
            onClick={() => setShowModal(true)}
            data-testid="submit-leave-btn"
            style={{
              padding: "8px 18px",
              background: "#C8721A",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            + Submit Leave
          </button>
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
            requests={requests.slice(0, 5)}
            isManager={false}
            onAction={loadData}
          />
        </div>
      </div>

      {showModal && (
        <SubmitLeaveModal
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
