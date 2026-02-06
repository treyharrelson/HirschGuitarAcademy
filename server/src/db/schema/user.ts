import { integer, varchar, pgEnum, pgTable, text} from "drizzle-orm/pg-core"
import { timestamps } from "./helpers/timestamps";

export const rolesEnum = pgEnum("roles", ["guest", "user", "teacher", "admin"]);

export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	fname: varchar({ length: 255 }),
	lname: varchar({ length: 255 }),
	mname: varchar({ length: 255 }),
	username: varchar({ length: 255 }).notNull(),
	email: text().notNull().unique(),
	password: varchar({ length: 255 }).notNull(),
	role: rolesEnum().notNull().default("guest"),
	...timestamps
});
