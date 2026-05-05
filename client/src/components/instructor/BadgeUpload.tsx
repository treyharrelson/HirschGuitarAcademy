import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';

interface BadgeUploadProps {
  url: string;
  onUploadSuccess: (fileKey: string) => void;
  onRemove: () => void;
}

const BadgeUpload: React.FC<BadgeUploadProps> = ({ url, onUploadSuccess, onRemove }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState('');

  useEffect(() => {
    if (!url) {
      setDisplayUrl('');
      return;
    }
    api.get('/api/upload/file-url', { params: { fileKey: url } })
      .then(res => setDisplayUrl(res.data.presignedUrl))
      .catch(() => setDisplayUrl(''));
  }, [url]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'badges');

    try {
      const response = await api.post('/api/upload/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadSuccess(response.data.fileKey);
    } catch (err) {
      console.error("Badge upload failed", err);
      alert("Failed to upload badge.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden relative group transition-all hover:border-[#ff9f1c]/50">
      {displayUrl ? (
        <>
          <img src={displayUrl} alt="Badge Preview" className="w-full h-full object-contain p-4" />
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-white text-black px-4 py-1.5 rounded-full font-black uppercase tracking-tighter hover:bg-gray-200 transition-transform active:scale-95">Replace</button>
            <button type="button" onClick={onRemove} className="text-[10px] bg-red-600 text-white px-4 py-1.5 rounded-full font-black uppercase tracking-tighter hover:bg-red-700 transition-transform active:scale-95">Remove</button>
          </div>
        </>
      ) : (
        <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-4 hover:bg-white transition-colors">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-[#ff9f1c] border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-[10px] font-black text-[#ff9f1c] tracking-widest uppercase">Uploading...</span>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3">🏅</div>
              <span className="text-xs font-black text-gray-800 uppercase tracking-widest mb-1 text-center">Add Badge Icon</span>
              {/* HELPER TEXT */}
              <div className="flex flex-col items-center opacity-60">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Recommended: 400x400 px</span>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">PNG (Transparent) or SVG</span>
              </div>
            </>
          )}
        </div>
      )}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/png,image/svg+xml,image/webp" onChange={handleFileUpload} />
    </div>
  );
};

export default BadgeUpload;