import { useState, type SubmitEvent } from 'react';
import api from '../../api/axiosInstance';
import { type Attachment } from '../../types/post';
import MediaBlockEditor from '../instructor/MediaBlockEditor'

type Props = {
    threadId?: number; // if set, posts to the thread, if absent, posts to global feed
    onPosted?: () => void;
    placeholder?: string;
    submitLabel?: string;
};

interface MediaSlot {
    slotId: number;
    fileKey: string;
    attachment: Attachment | null;
}

let slotCounter = 0;
const newSlot = (): MediaSlot => ({ slotId: ++slotCounter, fileKey: '', attachment: null });

export default function PostComposer({
    threadId,
    onPosted,
    placeholder = 'Write something...',
    submitLabel = 'Post',
}: Props) {
    const [content, setContent] = useState('');
    const [slots, setSlots] = useState<MediaSlot[]>([newSlot()]);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const updateSlot = (slotId: number, fileKey: string, meta?: { fileType: string; fileName: string }) => {
        setSlots(prev => prev.map(s => {
            if (s.slotId !== slotId) return s;
            if (!fileKey) return { ...s, fileKey: '', attachment: null };
            const isExternalUrl = fileKey.startsWith('http://') || fileKey.startsWith('https://');
            const attachment = meta
            ? {fileKey, fileType: meta.fileType, fileName: meta.fileName }
            : isExternalUrl
                ? { fileKey, fileType: 'link/external', fileName: fileKey }
                : s.attachment;
            return { ...s, fileKey, attachment };
        }));
    };

    const removeSlot = (slotId: number) => {
        setSlots(prev => {
            const filtered = prev.filter(s => s.slotId !== slotId);
            return filtered.length === 0 ? [newSlot()] : filtered;
        });
    };

    const addSlot = () => setSlots(prev => [...prev, newSlot()]);

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        if (!content.trim()) return; // prevents empty posts
        setSubmitting(true);
        setError('');

        const attachments = slots.map(s => s.attachment).filter(Boolean) as Attachment[];

        try {
            if (threadId !== undefined) {
                await api.post(`/api/threads/${threadId}/posts`, { content, attachments });
            } else {
                await api.post('/api/threads/feed', { content, attachments });
            }
            setContent('');
            setSlots([newSlot()]);
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

            <div className="mt-3 flex flex-col gap-3">
                {slots.map((slot) => (
                    <div key={slot.slotId} className="relative">
                        {slots.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeSlot(slot.slotId)}
                                className="absolute top-2 right-2 z-10 bg-white text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm transition-colors"
                            >
                                ×
                            </button>
                        )}
                        <MediaBlockEditor
                            type="any"
                            folder="forum"
                            url={slot.fileKey}
                            onUploadSuccess={(fileKey, meta) => updateSlot(slot.slotId, fileKey, meta)}
                        />
                    </div>
                ))}
            </div>         

            <button
                type="button"
                onClick={addSlot}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
            >
                + Add another file
            </button>

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