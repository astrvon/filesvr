import Elysia, { t } from "elysia";
import { auth } from "@/src/middleware/auth";
import { userSchema } from "@/src/schema";
import { users } from "@/src/db/schema";
import { db } from "@/src/db";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcrypt";

export const authRoutes = new Elysia()
	.use(auth)
	.post(
		"/register",
		async ({ body, signJwt, setAuthCookie }) => {
			const validatedBody = userSchema.parse(body);
			const { username, password } = validatedBody;

			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);
			if (existingUser.length) {
				throw new Error("Username already exists");
			}

			const hashedPassword: string = await hash(password, 10);

			const newUser = await db.insert(users).values({
				username,
				password: hashedPassword,
			});

			const user = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (!user.length) {
				throw new Error("Failed to create user");
			}

			const token: string = await signJwt({
				id: user[0].id,
				isAdmin: user[0].isAdmin,
			});
			setAuthCookie(token);

			return { message: "User registered successfully" };
		},
		{
			body: t.Object({
				username: t.String(),
				password: t.String(),
			}),
		},
	)
	.post(
		"/login",
		async ({ body, signJwt, setAuthCookie }) => {
			const validatedBody = userSchema.parse(body);
			const { username, password } = validatedBody;

			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (!user) {
				throw new Error("Invalid credentials");
			}

			const isPasswordValid: boolean = await compare(password, user.password);
			if (!isPasswordValid) {
				throw new Error("Invalid credentials");
			}

			const token = await signJwt({ id: user.id, isAdmin: user.isAdmin });
			setAuthCookie(token);

			return { message: "Logged in successfully" };
		},
		{
			body: t.Object({
				username: t.String(),
				password: t.String(),
			}),
		},
	)
	.post("/logout", ({ removeCookie }) => {
		removeCookie("auth");
		return { message: "Logged out successfully" };
	});
