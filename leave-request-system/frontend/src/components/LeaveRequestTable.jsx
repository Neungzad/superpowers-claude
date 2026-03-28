import { approveRequest, rejectRequest } from "../api/leaveRequests.js";

const STATUS_STYLE = {
  PENDING: { background: "#FEF9C3", color: "#854D0E" },
  APPROVED: { background: "#DCFCE7", color: "#166534" },
  REJECTED: { background: "#FEE2E2", color: "#991B1B" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || {};
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 100,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ...s,
      }}
    >
      {status}
    </span>
  );
}

export default function LeaveRequestTable({
  requests,
  isManager = false,
  onAction,
}) {
  async function handleApprove(id) {
    await approveRequest(id);
    onAction?.();
  }

  async function handleReject(id) {
    await rejectRequest(id);
    onAction?.();
  }

  if (requests.length === 0) {
    return (
      <p style={{ color: "#9A948C", fontSize: 13, padding: "16px 0" }}>
        No requests found.
      </p>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {isManager && <th style={thStyle}>Employee</th>}
          <th style={thStyle}>Type</th>
          <th style={thStyle}>Dates</th>
          <th style={thStyle}>Days</th>
          <th style={thStyle}>Reason</th>
          <th style={thStyle}>Status</th>
          {isManager && <th style={thStyle}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {requests.map((r) => (
          <tr key={r.id} style={{ borderBottom: "1px solid #EDE9E2" }}>
            {isManager && (
              <td style={tdStyle}>
                <strong>{r.userName}</strong>
              </td>
            )}
            <td style={tdStyle}>{r.leaveType}</td>
            <td style={tdStyle}>
              {formatDate(r.startDate)} – {formatDate(r.endDate)}
            </td>
            <td style={tdStyle}>{r.totalDays}</td>
            <td style={{ ...tdStyle, color: "#9A948C", maxWidth: 160 }}>
              {r.reason || "—"}
            </td>
            <td style={tdStyle}>
              <StatusBadge status={r.status} />
            </td>
            {isManager && r.status === "PENDING" && (
              <td style={tdStyle}>
                <button
                  onClick={() => handleApprove(r.id)}
                  style={approveBtnStyle}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(r.id)}
                  style={rejectBtnStyle}
                >
                  ✕ Reject
                </button>
              </td>
            )}
            {isManager && r.status !== "PENDING" && <td style={tdStyle} />}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const thStyle = {
  padding: "8px 12px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#9A948C",
};
const tdStyle = { padding: "12px 12px" };
const approveBtnStyle = {
  padding: "5px 12px",
  background: "#DCFCE7",
  color: "#166534",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
  marginRight: 6,
};
const rejectBtnStyle = {
  padding: "5px 12px",
  background: "#FEE2E2",
  color: "#991B1B",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
};
