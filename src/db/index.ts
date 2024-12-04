import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/src/db/schema";

const connectionString: string | undefined = Bun.env.DATABASE_URL;

if (!connectionString)
	throw new Error("Database URL is not available, have you already set it up?");

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
