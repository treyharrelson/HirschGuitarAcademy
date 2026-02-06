import {text, integer, pgTable, varchar } from "drizzle-orm/pg-core"
import { users } from "./user";
import { timestamps } from "./helpers/timestamps";

export const posts = pgTable("posts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userid: integer().references(() => users.id),
	title: varchar().notNull(),
	content: text().notNull(),
	likes: integer().default(0),
	...timestamps
});
