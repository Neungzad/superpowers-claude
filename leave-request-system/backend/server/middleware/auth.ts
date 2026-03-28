export default defineEventHandler(async (event) => {
  const skipPaths = ["/api/auth/login", "/api/auth/logout"];
  if (skipPaths.some((p) => event.path?.startsWith(p))) return;

  const session = await getSession(event);
  if (!session.data?.id) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  event.context.user = session.data;
});
