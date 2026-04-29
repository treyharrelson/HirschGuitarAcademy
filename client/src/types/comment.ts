import { type ReactionType } from './reaction';

export interface Comment {
    id: number;
    postId: number;
    content: string;
    createdAt: string;
    author?: {
        userName: string;
        firstName: string;
        lastName: string;
    };
    counts: Record<ReactionType, number>;
    userReaction: ReactionType | null;
}