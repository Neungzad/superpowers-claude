export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const { leaveType, startDate, endDate, reason } = await readBody(event);

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw createError({ statusCode: 422, statusMessage: "Invalid dates" });
  }

  if (end < start) {
    throw createError({
      statusCode: 422,
      statusMessage: "End date must be on or after start date",
    });
  }

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const startUTC = new Date(startDate);
  startUTC.setUTCHours(0, 0, 0, 0);
  if (startUTC < todayUTC) {
    throw createError({
      statusCode: 422,
      statusMessage: "Start date cannot be in the past",
    });
  }

  if (!["ANNUAL", "SICK", "PERSONAL"].includes(leaveType)) {
    throw createError({ statusCode: 422, statusMessage: "Invalid leave type" });
  }

  const totalDays = countBusinessDays(start, end);
  const year = new Date(startDate).getUTCFullYear();

  const balResult = await pool.query(
    "SELECT total_days, used_days FROM leave_balances WHERE user_id = $1 AND leave_type = $2 AND year = $3",
    [user.id, leaveType, year],
  );
  const balance = balResult.rows[0];
  const remainingDays = balance ? balance.total_days - balance.used_days : 0;
  const balError = validateBalance(totalDays, remainingDays);
  if (balError) {
    throw createError({ statusCode: 422, statusMessage: balError });
  }

  const existingResult = await pool.query(
    "SELECT start_date, end_date, status FROM leave_requests WHERE user_id = $1",
    [user.id],
  );
  if (hasOverlap(start, end, existingResult.rows)) {
    throw createError({
      statusCode: 422,
      statusMessage:
        "Request overlaps with an existing pending or approved request",
    });
  }

  if (leaveType === "SICK") {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const insertResult = await client.query(
        `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED') RETURNING id`,
        [user.id, leaveType, startDate, endDate, totalDays, reason || null],
      );
      await client.query(
        "UPDATE leave_balances SET used_days = used_days + $1 WHERE user_id = $2 AND leave_type = $3 AND year = $4",
        [totalDays, user.id, leaveType, year],
      );
      await client.query("COMMIT");
      setResponseStatus(event, 201);
      return { id: insertResult.rows[0].id, status: "APPROVED", totalDays };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  const insertResult = await pool.query(
    `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING id`,
    [user.id, leaveType, startDate, endDate, totalDays, reason || null],
  );
  setResponseStatus(event, 201);
  return { id: insertResult.rows[0].id, status: "PENDING", totalDays };
});
