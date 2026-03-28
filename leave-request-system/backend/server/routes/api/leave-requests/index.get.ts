export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const query = getQuery(event);

  let sql = `
    SELECT lr.id, lr.user_id, u.name AS user_name, lr.leave_type,
           lr.start_date, lr.end_date, lr.total_days, lr.reason,
           lr.status, lr.reviewed_by, lr.reviewed_at, lr.created_at
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (user.role === "employee") {
    params.push(user.id);
    sql += ` AND lr.user_id = $${params.length}`;
  }

  if (query.status) {
    params.push(query.status);
    sql += ` AND lr.status = $${params.length}`;
  }

  if (query.userId && user.role === "manager") {
    params.push(Number(query.userId));
    sql += ` AND lr.user_id = $${params.length}`;
  }

  sql += " ORDER BY lr.created_at DESC";

  const result = await pool.query(sql, params);

  return result.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    leaveType: r.leave_type,
    startDate: r.start_date,
    endDate: r.end_date,
    totalDays: r.total_days,
    reason: r.reason,
    status: r.status,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    createdAt: r.created_at,
  }));
});
