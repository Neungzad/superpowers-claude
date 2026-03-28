export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (user.role !== "manager") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const id = getRouterParam(event, "id");
  const result = await pool.query(
    "SELECT status FROM leave_requests WHERE id = $1",
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

  await pool.query(
    "UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3",
    ["REJECTED", user.id, id],
  );
  return { ok: true };
});
