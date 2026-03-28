import { useState } from "react";
import { submitRequest } from "../api/leaveRequests.js";

function countBusinessDays(start, end) {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default function SubmitLeaveModal({ onClose, onSuccess }) {
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const businessDays =
    startDate && endDate && endDate >= startDate
      ? countBusinessDays(new Date(startDate), new Date(endDate))
      : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await submitRequest({
        leaveType,
        startDate,
        endDate,
        reason: reason || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,24,20,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 32,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Request Time Off</h2>
          <button
            onClick={onClose}
            style={{
              background: "#F7F4EF",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={inputStyle}
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="PERSONAL">Personal Leave</option>
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Reason{" "}
              <span style={{ fontWeight: 400, color: "#9A948C" }}>
                (optional)
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your reason…"
              style={{
                ...inputStyle,
                height: 72,
                resize: "none",
                paddingTop: 10,
              }}
            />
          </div>

          {businessDays > 0 && (
            <div
              style={{
                background: "#F7F4EF",
                border: "1.5px solid #F5E4CC",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 16,
                fontSize: 13,
                color: "#C8721A",
                fontWeight: 600,
              }}
            >
              {businessDays} business day(s) will be deducted
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#FDF1F1",
                border: "1.5px solid #FEE2E2",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 16,
                fontSize: 13,
                color: "#991B1B",
                fontWeight: 600,
              }}
            >
              ✕ {error}
            </div>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 48,
                border: "1.5px solid #EDE9E2",
                background: "transparent",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 48,
                background: "#1A1814",
                color: "white",
                border: "none",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {loading ? "Submitting…" : "Submit Request →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const fieldStyle = { marginBottom: 14 };
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
