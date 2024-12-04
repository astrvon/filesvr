import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();
export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		url: process.env.DATABASE_URL!,
	},
} satisfies Config;
