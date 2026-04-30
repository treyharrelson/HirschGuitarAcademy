import { type ReactionType } from './reaction';

export interface Comment {
    id: number;
    postId: number;
    content: string;
    createdAt: string;
    author?: {
        id: number;
        userName: string;
        firstName: string;
        lastName: string;
        name: string;
    };
    counts: Record<ReactionType, number>;
    userReaction: ReactionType | null;
}