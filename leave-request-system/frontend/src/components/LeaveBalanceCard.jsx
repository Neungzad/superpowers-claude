const TYPE_COLORS = {
  ANNUAL: "#1E4D7B",
  SICK: "#2A6B4A",
  PERSONAL: "#C8721A",
};

export default function LeaveBalanceCard({
  leaveType,
  totalDays,
  usedDays,
  remainingDays,
}) {
  const color = TYPE_COLORS[leaveType] || "#555";
  const pct = totalDays > 0 ? Math.round((remainingDays / totalDays) * 100) : 0;

  return (
    <div
      style={{
        background: "#F7F4EF",
        border: "1.5px solid #EDE9E2",
        borderRadius: 14,
        padding: "20px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color,
          marginBottom: 10,
        }}
      >
        {leaveType.charAt(0) + leaveType.slice(1).toLowerCase()}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1,
          color: "#1A1814",
          marginBottom: 4,
        }}
      >
        {remainingDays}
      </div>
      <div style={{ fontSize: 12, color: "#9A948C" }}>
        of {totalDays} days remaining
      </div>
      <div
        style={{
          marginTop: 14,
          height: 4,
          background: "#EDE9E2",
          borderRadius: 2,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
