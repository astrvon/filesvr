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
        responses: {
          "200": {
            description: "Successful Response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        username: { type: "string" },
                        email: { type: "string" },
                        password: { type: "string" },
                        isAdmin: { type: "boolean" },
                        createdAt: { type: "string" },
                        modifiedAt: { type: "string" },
                      },
                    },
                  },
                },
                example: {
                  message: "User registered successfully",
                  user: {
                    id: "9afd7cae-f066-4958-9209-ddcb16642c70",
                    name: "Admin",
                    username: "admin",
                    email: "admin@lahelu.com",
                    password: "top_secret",
                    isAdmin: false,
                    createdAt: "2024-12-06T10:13:38.349Z",
                    modifiedAt: "2024-12-06T10:13:38.349Z",
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad Request Response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    code: { type: "number" },
                    message: { type: "string" },
                  },
                },
                examples: {
                  usernameDuplicate: {
                    summary: "User username duplicate",
                    value: {
                      code: 400,
                      message:
                        'duplicate key value violates unique constraint "users_username_unique"',
                    },
                  },
                  emailDuplicate: {
                    summary: "User email duplicate",
                    value: {
                      code: 400,
                      message:
                        'duplicate key value violates unique constraint "users_email_unique"',
                    },
                  },
                },
              },
            },
          },
        },
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
        responses: {
          "200": {
            description: "Successful Response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    username: { type: "string" },
                    email: { type: "string" },
                    token: { type: "string" },
                  },
                },
                example: {
                  id: "9972ad30-8bb8-4628-ab2c-bc8fd3a7cf94",
                  name: "admin",
                  username: "admin",
                  email: "admin@lahelu.com",
                  token: "jwt_token",
                },
              },
            },
          },
          "400": {
            description: "Bad Request Response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    code: { type: "number" },
                    message: { type: "string" },
                  },
                },
                examples: {
                  invalidCredentials: {
                    summary: "Password/Username Invalid",
                    value: {
                      code: 400,
                      message: "Invalid credentials",
                    },
                  },
                },
              },
            },
          },
        },
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
