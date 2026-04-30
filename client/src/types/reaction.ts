export type ReactionType = 'like' | 'love' | 'laugh' | 'fire' | 'celebrate';

export interface ReactionSummary {
    counts: Record<ReactionType, number>;
    userReaction: ReactionType | null;
}

export const REACTION_EMOJIS: Record<ReactionType, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    fire: '🔥',
    celebrate: '🎉',
};