import cookie from "@elysiajs/cookie";
import jwt, { type JWTPayloadSpec } from "@elysiajs/jwt";
import Elysia, { type Cookie } from "elysia";

export const auth = new Elysia()
	.use(
		jwt({
			name: "jwt",
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			secret: Bun.env.JWT_SECRET!,
		}),
	)
	.use(cookie())
	.derive(({ jwt, cookie, setCookie }) => ({
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		signJwt: (payload: any): Promise<string> => jwt.sign(payload),
		verifyJwt: (
			token: string,
		): Promise<false | (Record<string, string | number> & JWTPayloadSpec)> =>
			jwt.verify(token),
		setAuthCookie: (token: string) =>
			setCookie("auth", token, { httpOnly: true, maxAge: 7 * 86400 }),
		getAuthCookie: (): Cookie<string | undefined> => cookie.auth,
	}))
	.derive(async ({ getAuthCookie, verifyJwt }) => {
		const authCookie: Cookie<string | undefined> = getAuthCookie();
		if (!authCookie) return { user: null };

		try {
			const payload:
				| false
				| (Record<string, string | number> & JWTPayloadSpec) = await verifyJwt(
				authCookie as unknown as string,
			);
			if (!payload) throw new Error("Invalid token");
			return { user: payload };
		} catch (err) {
			console.error(
				"JWT verification failed:",
				err instanceof Error ? err.message : err,
			);
			return { user: null };
		}
	});
