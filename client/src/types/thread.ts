import type { User } from "./user";

export interface Thread {
    id: number;
    title: string;
    createdAt: string;
    author?: User;
}