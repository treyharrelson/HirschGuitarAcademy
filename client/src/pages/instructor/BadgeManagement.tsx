import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import BadgeUpload from '../../components/instructor/BadgeUpload';

interface Badge {
    id: number;
    name: string;
    imageUrl: string;
    displayUrl?: string;
}

export default function BadgeManagement() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [showModal, setShowModal] = useState(false);

    // New Badge Form State
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');

    const fetchBadges = async () => {
        try {
            const res = await api.get<Badge[]>('/api/badges');
            setBadges(res.data);
        } catch (err) {
            console.error("Error fetching badges", err);
        }
    };

    useEffect(() => { fetchBadges(); }, []);

    const handleCreateBadge = async () => {
        if (!newName || !newUrl) return alert("Please provide a name and an icon.");

        try {
            await api.post('/api/badges', { name: newName, imageUrl: newUrl });
            setShowModal(false);
            setNewName('');
            setNewUrl('');
            fetchBadges();
        } catch (err) {
            console.error("Error creating badge", err);
        }
    };

    return (
        <div className="p-8 bg-[#f8f9fa] min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Badge Library</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#2563eb] text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-blue-700 transition-all">
                        + Create New Badge
                    </button>
                </div>

                {/* Badge Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {badges.map(badge => (
                        <div key={badge.id} className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 text-center flex flex-col items-center">
                            <img src={badge.displayUrl} alt={badge.name} className="w-20 h-20 object-contain mb-4" />
                            <h3 className="font-bold text-gray-800">{badge.name}</h3>
                            <span className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Badge ID: {badge.id}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[30px] p-10 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-center">New Achievement Badge</h2>

                        <div className="flex flex-col items-center gap-6">
                            <BadgeUpload
                                url={newUrl}
                                onUploadSuccess={(key) => setNewUrl(key)}
                                onRemove={() => setNewUrl('')} />

                            <div className="w-full">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Badge Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Master of Metal"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full pt-4">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateBadge}
                                    className="py-3 bg-[#2563eb] text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all">
                                    Save Badge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}