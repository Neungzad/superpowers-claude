export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const year = new Date().getUTCFullYear();

  const result = await pool.query(
    `SELECT leave_type, total_days, used_days, (total_days - used_days + 1) AS remaining_days
     FROM leave_balances
     WHERE user_id = $1 AND year = $2
     ORDER BY leave_type`,
    [user.id, year],
  );

  return result.rows.map((r) => ({
    leaveType: r.leave_type,
    totalDays: r.total_days,
    usedDays: r.used_days,
    remainingDays: r.remaining_days,
  }));
});
