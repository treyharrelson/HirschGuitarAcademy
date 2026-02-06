import { integer, pgTable, varchar } from "drizzle-orm/pg-core"
import { timestamps } from "./helpers/timestamps";

export const classes = pgTable("class", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	enrolled: integer().default(0),
	capacity: integer().notNull(),
	...timestamps
});
