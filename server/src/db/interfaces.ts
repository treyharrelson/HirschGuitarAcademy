import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import * as schema from './schema'

export type User = InferSelectModel<typeof schema.users>
export type newUser = InferInsertModel<typeof schema.users>

export type Class = InferSelectModel<typeof schema.classes>
export type newClass = InferInsertModel<typeof schema.classes>

export type Post = InferSelectModel<typeof schema.posts>
export type newPost = InferInsertModel<typeof schema.posts>