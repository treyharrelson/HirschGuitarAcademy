import { type ReactionType } from './reaction';
import type { User } from "./user";

export interface Comment {
    id: number;
    postId: number;
    content: string;
    createdAt: string;
    author?: User;
    counts: Record<ReactionType, number>;
    userReaction: ReactionType | null;
}