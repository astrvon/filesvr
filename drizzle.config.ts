import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url:
			process.env.DATABASE_URL ??
			"postgres://postgres:Beruangkutub!06@localhost:5432/filesvr-test",
	},
} satisfies Config;
