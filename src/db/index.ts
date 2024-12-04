import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "pg";
import * as schema from "./schema";

const { Client } = postgres;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect();

export const db = drizzle(client, { schema });
