import { useState } from 'react';
import api from '../../api/axiosInstance';
import { REACTION_EMOJIS, type ReactionType, type ReactionSummary } from '../../types/reaction';
import {useAuth } from '../../context/useAuth';

type Props = {
    postId?: number;
    commentId?: number;
    initial: ReactionSummary;
};

const TYPES = Object.keys(REACTION_EMOJIS) as ReactionType[];

export default function ReactionBar({ postId, commentId, initial }: Props) {
    const [summary, setSummary] = useState<ReactionSummary>(initial);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleReact = async (type: ReactionType) => {
        if (!user || loading) return;
        setLoading(true);
        try {
            const url = commentId !== undefined
                ? `/api/posts/0/comments/${commentId}/reactions`
                : `/api/posts/${postId}/reactions`;
            const { data } = await api.post(url, { type });
            setSummary(data);
        } catch {
            console.error('Reaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
            {TYPES.map(type => {
                const count = summary.counts[type];
                const active = summary.userReaction === type;
                return (
                    <button
                        key={type}
                        onClick={() => handleReact(type)}
                        disabled={!user || loading}
                        title={type}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
                            ${active
                                ? 'bg-blue-100 border-blue-400 text-blue-700 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50'}
                            disabled:opacity-50 disabled:cursor-default`}
                    >
                        <span>{REACTION_EMOJIS[type]}</span>
                        {count > 0 && <span>{count}</span>}
                    </button>
                );
            })}
        </div>
    );
}