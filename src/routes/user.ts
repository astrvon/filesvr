import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePasswords } from "../utils/auth";
import { generateToken } from "../utils/jwt";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .post(
    "/register",
    async ({ body, set }) => {
      const { name, username, email, password } = body;

      try {
        const hashedPassword: string = await hashPassword(password);
        const newUser = await db
          .insert(users)
          .values({
            name,
            username,
            email,
            password: hashedPassword,
          })
          .returning();
        return { message: "User registered successfully", user: newUser[0] };
      } catch (err) {
        set.status = err instanceof Error ? 400 : 500;
        return {
          code: err instanceof Error ? 400 : 500,
          message: err instanceof Error ? err.message : err,
        };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        username: t.String(),
        email: t.String(),
        password: t.String(),
      }),
      detail: {
        tags: ["User"],
        summary: "Register User",
        description: "To register a new user",
      },
    },
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const { username, password } = body;
      try {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        if (
          user.length === 0 ||
          !(await comparePasswords(password, user[0].password))
        ) {
          throw new Error("Invalid credentials");
        }
        const token: string = await generateToken(user[0]);
        return {
          id: user[0].id,
          name: user[0].name,
          username: user[0].username,
          email: user[0].email,
          token,
        };
      } catch (err) {
        set.status = err instanceof Error ? 400 : 500;
        return {
          code: err instanceof Error ? 400 : 500,
          message: err instanceof Error ? err.message : err,
        };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
      detail: {
        tags: ["User"],
        summary: "Login User",
        description: "To login with existing user",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const { id } = params;
      const updatedUser = await db
        .update(users)
        .set(body)
        .where(eq(users.id, id))
        .returning();
      if (updatedUser.length === 0) {
        set.status = 404;
        return { message: "User not found" };
      }
      return { message: "User updated successfully", user: updatedUser[0] };
    },
    {
      beforeHandle: [authMiddleware, adminMiddleware],
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        isAdmin: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["User"],
        summary: "Update User",
        description:
          "To update an existing user [This endpoint can only be accessed by admin]",
        parameters: [{ name: "id", in: "id" }],
        security: [{ bearerAuth: [] }],
      },
    },
  );
