export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (user.role !== "manager") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const id = getRouterParam(event, "id");
  const result = await pool.query(
    "SELECT * FROM leave_requests WHERE id = $1",
    [id],
  );
  const request = result.rows[0];

  if (!request)
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  if (request.status !== "PENDING")
    throw createError({
      statusCode: 409,
      statusMessage: "Request is not pending",
    });

  const year = new Date(request.start_date).getUTCFullYear();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3",
      ["APPROVED", user.id, id],
    );
    await client.query(
      "UPDATE leave_balances SET used_days = used_days + $1 WHERE user_id = $2 AND leave_type = $3 AND year = $4",
      [request.total_days, request.user_id, request.leave_type, year],
    );
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
