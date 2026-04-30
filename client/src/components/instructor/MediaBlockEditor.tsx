import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';

type AllowedFolder = 'course-thumbnails' | 'lecture-content';

interface MediaBlockEditorProps {
    type: 'image' | 'video';
    url: string; // either an R2 fileKey, an external URL, or ''
    folder: AllowedFolder;
    onUploadSuccess: (fileKey: string) => void;
}

const R2_FOLDERS = ['forum/', 'course-thumbnails/', 'lecture-content/', 'profile-pictures/'];

// returns true when the value looks like an R2 storage key rather than a full URL
const isFileKey = (value: string) =>
    R2_FOLDERS.some(prefix => value.startsWith(prefix));

const MediaBlockEditor: React.FC<MediaBlockEditorProps> = ({ type, url, folder, onUploadSuccess }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [uploading, setUploading] = useState(false);
    const [inputMode, setInputMode] = useState<'upload' | 'link'>('upload');
    const [linkValue, setLinkValue] = useState('');
    const [displayUrl, setDisplayUrl] = useState(''); // the URL we actually render

    useEffect(() => {
        if (!url) {
            setDisplayUrl('');
            return;
        }
        if (isFileKey(url)) {
            // Resolve R2 file key → short-lived presigned URL for display
            api.get('/api/upload/file-url', { params: { fileKey: url } })
                .then(res => setDisplayUrl(res.data.presignedUrl))
                .catch(() => setDisplayUrl(''));
        } else {
            // External URL (YouTube, direct link, etc.) — use as-is
            setDisplayUrl(url);
        }
    }, [url]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
            const response = await api.post('/api/upload/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onUploadSuccess(response.data.fileKey);
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
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)\??v?=?([^#&?]*)).*/;
        const match = url.match(regExp);
        const videoId = (match && match[7].length === 11) ? match[7] : null;

        if (videoId) {
            return (
                <iframe
                    className="w-full aspect-video rounded-lg shadow-md"
                    src={"https://youtube.com" + "/embed/" + videoId}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                />
            );
        }

        return <video src={url} controls className="w-full rounded-lg shadow-md" />;
    };

    return (
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg bg-white w-full h-full flex flex-col items-center justify-center">
            {displayUrl ? (
                /* PREVIEW MODE */
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    <div className="relative group h-full w-full flex items-center justify-center">
                        {type === 'image' ? (
                            <img
                                src={displayUrl}
                                alt="Preview"
                                className="max-w-full max-h-full w-auto h-auto rounded-lg shadow-md object-contain"
                            />
                        ) : (
                            renderVideoPlayer(displayUrl)
                        )}

                        {/* Overlay button container */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-20">
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setLinkValue('');
                                    onUploadSuccess('');
                                }}
                                className="bg-white text-gray-800 px-4 py-2 rounded-md font-bold text-sm shadow-lg hover:bg-gray-100 transition-colors pointer-events-auto cursor-pointer relative z-30"
                            >
                                Replace Media
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* INPUT MODE */
                <div className="flex flex-col items-center justify-center py-4 w-full">
                    {/* Toggle between Upload and Link */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                        <button
                            type="button"
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${inputMode === 'upload' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setInputMode('upload')}>
                            FILE UPLOAD
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${inputMode === 'link' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setInputMode('link')}>
                            EXTERNAL LINK
                        </button>
                    </div>

                    {uploading ? (
                        <p className="text-blue-500 animate-pulse font-medium">Processing...</p>
                    ) : inputMode === 'upload' ? (
                        <div
                            onClick={(e) => {
                                e.stopPropagation(); // Stop Dnd-kit from intercepting
                                fileInputRef.current?.click(); // Manually trigger the window
                            }}
                            className="flex flex-col items-center cursor-pointer p-4 hover:bg-gray-50 rounded-xl transition-all">
                            <span className="text-3xl mb-2">{type === 'image' ? '🖼️' : '🎥'}</span>
                            <span className="text-sm font-semibold text-gray-700">Choose {type} file</span>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept={type === 'video' ? "video/*" : "image/*"}
                                onChange={handleFileUpload}/>
                        </div>
                    ) : (
                        <div className="flex flex-col w-full max-w-md gap-2">
                            <input
                                type="text"
                                placeholder={`Paste ${type} URL here...`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                                value={linkValue}
                                onChange={(e) => setLinkValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleLinkSubmit();
                                    }
                                }}/>
                            <button
                                type="button"
                                onClick={handleLinkSubmit}
                                className="bg-blue-600 text-white py-2 rounded-md font-bold text-sm hover:bg-blue-700">
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
