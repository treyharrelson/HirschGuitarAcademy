import type { User } from "./user";

export interface Thread {
    id: number;
    title: string;
    authorId: number;
    visibility: 'public' | 'global' | 'private';
    parentThreadId: number | null;
    createdAt: string;
    author?: User;
}