import bcrypt from "bcryptjs";

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  const result = await pool.query(
    "SELECT id, name, email, role, password FROM users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  const session = await getSession(event);
  await session.update({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
});
