import {
	boolean,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	username: text("username").notNull().unique(),
	password: text("password").notNull(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	filename: text("filename").notNull(),
	category: varchar("category", { length: 20 }).notNull(),
	path: text("path").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
