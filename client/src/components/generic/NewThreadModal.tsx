import { useState } from 'react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import VisibilityToggle from './VisibilityToggle';

interface NewThreadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

function NewThreadModal({ isOpen, onClose, onCreated }: NewThreadModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'global' | 'private'>('public');
    const [makeAnnouncement, setMakeAnnouncement] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        setTitle('');
        setVisibility('public');
        setMakeAnnouncement(true);
        setError('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Thread title is required.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await api.post('/api/threads', { title, visibility, makeAnnouncement });
            handleClose();
            onCreated();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error creating thread');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-blue-700">New Thread</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Title input */}
                <div className="mb-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Thread Title
                    </label>
                    <input
                        type="text"
                        placeholder="What's this thread about?"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        autoFocus
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Announcement toggle — visible to everyone */}
                <div className="flex items-center justify-between py-3.5 border-t border-gray-100 mt-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Announcement Post</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Broadcast a global announcement when this thread is created
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMakeAnnouncement(prev => !prev)}
                        aria-label="Toggle announcement post"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                            makeAnnouncement ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                makeAnnouncement ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {/* Visibility control — admin only */}
                {user?.role === 'admin' && (
                    <div className="flex items-center justify-between py-3.5 border-t border-gray-100">
                        <div>
                            <p className="text-sm font-semibold text-gray-700">Visibility</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Control who can see this thread
                            </p>
                        </div>
                        <VisibilityToggle
                            value={visibility}
                            onChange={setVisibility}
                            disabled={submitting}
                        />
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !title.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Creating…' : 'Create Thread'}
                    </button>
                </div>
            </div>
        </div>
    );
}


export default NewThreadModal;