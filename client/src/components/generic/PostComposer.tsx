import { useState, type SubmitEvent } from 'react';
import api from '../../api/axiosInstance';
import { type Attachment } from '../../types/post';
import FileUpload from '../FileUpload';

type Props = {
    threadId?: number; // if set, posts to the thread, if absent, posts to global feed
    onPosted?: () => void;
    placeholder?: string;
    submitLabel?: string;
};

export default function PostComposer({
    threadId,
    onPosted,
    placeholder = 'Write something...',
    submitLabel = 'Post',
}: Props) {
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploadKey, setUploadKey] = useState(0);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        if (!content.trim()) return; // prevents empty posts
        setSubmitting(true);
        setError('');
        try {
            if (threadId !== undefined) {
                await api.post(`/api/threads/${threadId}/posts`, { content, attachments });
            } else {
                await api.post('/api/threads/feed', { content, attachments });
            }
            setContent('');
            setAttachments([]);
            setUploadKey(k => k + 1);
            onPosted?.();
        } catch {
            setError('Failed to post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <textarea
                    placeholder={placeholder}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    rows={3}
                    className="w-full resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />

                <FileUpload
                    key={uploadKey}
                    folder="forum"
                    onUploadComplete={file => setAttachments(prev => [...prev, file])}
                />

                {attachments.length > 0 && (
                    <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                        {attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                <span>📎 {att.fileName}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAttachments(prev => prev.filter((_, j) => j !== i));
                                        setUploadKey(k => k + 1);
                                    }}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                <div className="flex justify-end mt-3">
                    <button
                        type="submit"
                        disabled={submitting || !content.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all"
                    >
                        {submitting ? 'Posting...' : submitLabel}
                    </button>
                </div>
            </form>
    );
}