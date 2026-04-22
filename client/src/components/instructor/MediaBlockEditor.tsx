import React, { useState } from 'react';
import axios from 'axios';

interface MediaBlockEditorProps {
    type: 'image' | 'video';
    url: string;
    onUploadSuccess: (url: string) => void;
}

const MediaBlockEditor: React.FC<MediaBlockEditorProps> = ({ type, url, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [inputMode, setInputMode] = useState<'upload' | 'link'>('upload');
    const [linkValue, setLinkValue] = useState(url || '');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/api/upload', formData, { withCredentials: true });
            onUploadSuccess(response.data.url);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const handleLinkSubmit = () => {
        if (linkValue.trim()) {
            onUploadSuccess(linkValue.trim());
        }
    };

    const renderVideoPlayer = (url: string) => {
        const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)/);

        if (ytMatch && ytMatch[1]) {
            const videoId = ytMatch[1];
            return (
                <iframe
                    className="w-full aspect-video rounded-lg shadow-md"
                    src={"https://youtube.com" + "/embed/" + videoId}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            );
        }

        return <video src={url} controls className="w-full rounded-lg shadow-md" />;
    };

    return (
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg bg-white">
            {url ? (
                /* PREVIEW MODE */
                <div className="relative group w-full max-w-lg">
                    {type === 'image' ? (
                        <img src={url} alt="Preview" className="w-full h-auto rounded-lg shadow-md" />
                    ) : (
                        // Call the helper here for videos
                        renderVideoPlayer(url)
                    )}

                    {/* Overlay button to replace media */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-20 pointer-events-none">
                        <button
                            onClick={() => onUploadSuccess('')}
                            className="bg-white text-gray-800 px-4 py-2 rounded-md font-bold text-sm shadow-lg pointer-events-auto"
                        >
                            Replace Media
                        </button>
                    </div>
                </div>
            ) : (
                /* INPUT MODE */
                <div className="flex flex-col items-center justify-center py-4 w-full">
                    {/* Toggle between Upload and Link */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                        <button
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${inputMode === 'upload' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setInputMode('upload')}
                        >
                            FILE UPLOAD
                        </button>
                        <button
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${inputMode === 'link' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setInputMode('link')}
                        >
                            EXTERNAL LINK
                        </button>
                    </div>

                    {uploading ? (
                        <p className="text-blue-500 animate-pulse font-medium">Processing...</p>
                    ) : inputMode === 'upload' ? (
                        <label className="flex flex-col items-center cursor-pointer p-4 hover:bg-gray-50 rounded-xl transition-all">
                            <span className="text-3xl mb-2">{type === 'image' ? '🖼️' : '🎥'}</span>
                            <span className="text-sm font-semibold text-gray-700">Choose {type} file</span>
                            <input type="file" className="hidden" accept={type === 'video' ? "video/*" : "image/*"} onChange={handleFileUpload} />
                        </label>
                    ) : (
                        <div className="flex flex-col w-full max-w-md gap-2">
                            <input
                                type="text"
                                placeholder={`Paste ${type} URL here...`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                                value={linkValue}
                                onChange={(e) => setLinkValue(e.target.value)}
                            />
                            <button
                                onClick={handleLinkSubmit}
                                className="bg-blue-600 text-white py-2 rounded-md font-bold text-sm hover:bg-blue-700"
                            >
                                Embed {type === 'video' ? 'Video' : 'Image'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaBlockEditor;
