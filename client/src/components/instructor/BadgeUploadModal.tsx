import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import BadgeUpload from './BadgeUpload';

interface Badge {
    id: number;
    name: string;
    imageUrl: string;
}

interface BadgeUploadModalProps {
    onClose: () => void;
    onSuccess: (newBadge: Badge) => void;
}

const BadgeUploadModal: React.FC<BadgeUploadModalProps> = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [fileKey, setFileKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name || !fileKey) {
            alert("Please provide a name and upload an icon.");
            return;
        }

        setIsSaving(true);
        try {
            const response = await api.post('/api/badges', {
                name,
                imageUrl: fileKey,
            });

            onSuccess(response.data);
        } catch (err) {
            console.error("Failed to save badge:", err);
            alert("Error saving badge to database.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[30px] p-8 w-full max-w-md shadow-2xl border border-gray-100">
                <h2 className="text-xl font-bold mb-6 text-center text-gray-800">Create Achievement Badge</h2>

                <div className="flex flex-col items-center gap-6">
                    <BadgeUpload
                        url={fileKey}
                        onUploadSuccess={(key) => setFileKey(key)}
                        onRemove={() => setFileKey('')}/>

                    <div className="w-full">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
                            Badge Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Speed Demon"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"/>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all uppercase text-xs tracking-widest">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="py-3 bg-[#2563eb] text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all uppercase text-xs tracking-widest disabled:opacity-50">
                            {isSaving ? "Saving..." : "Save Badge"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgeUploadModal;