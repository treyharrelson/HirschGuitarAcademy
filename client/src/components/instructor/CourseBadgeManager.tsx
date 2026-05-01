import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import BadgeUploadModal from './BadgeUploadModal';

interface Badge {
    id: number;
    name: string;
    imageUrl: string;
}

interface CourseBadgeManagerProps {
    currentBadgeId: number | null;
    onBadgeSelect: (id: number | null) => void;
}

const CourseBadgeManager: React.FC<CourseBadgeManagerProps> = ({ currentBadgeId, onBadgeSelect }) => {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    // Fetch all available badges for the dropdown
    useEffect(() => {
        api.get('/api/badges').then(res => setBadges(res.data));
    }, []);

    useEffect(() => {
        const selectedBadge = badges.find(b => b.id === currentBadgeId);
        if (selectedBadge) {
            // Resolve the R2 key to a presigned URL
            api.get('/api/upload/file-url', { params: { fileKey: selectedBadge.imageUrl } })
                .then(res => setPreviewUrl(res.data.presignedUrl))
                .catch(() => setPreviewUrl(''));
        } else {
            setPreviewUrl('');
        }
    }, [currentBadgeId, badges]);

    return (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                Completion Badge
            </label>

            <div className="flex items-center gap-4">
                {/* BADGE PREVIEW CIRCLE */}
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                        <span className="text-[10px] text-gray-300 font-bold">NONE</span>
                    )}
                </div>

                <select
                    value={currentBadgeId || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        onBadgeSelect(val === '' ? null : Number(val));
                    }}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium h-12">
                    <option value="">No Badge (Default)</option>
                    {badges.map(badge => (
                        <option key={badge.id} value={badge.id}>
                            {badge.name}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 h-12 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm">
                    + Create
                </button>
            </div>

            {showCreateModal && (
                <BadgeUploadModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={(newBadge: Badge) => {
                        setBadges((prev) => [...prev, newBadge]);
                        onBadgeSelect(newBadge.id);
                        setShowCreateModal(false);
                    }}/>
            )}
        </div>
    );
};
export default CourseBadgeManager;