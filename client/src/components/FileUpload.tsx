import { useState, useCallback } from 'react';
import axios from 'axios';
import { type Attachment } from '../types/post';

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf'
];

const MAX_SIZE_MB = 100;


interface FileUploadProps {
    onUploadComplete: (file: Attachment) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const[preview, setPreview] = useState<string | null>(null);

    const uploadFile = useCallback(async (file: File) => {
        setError(null);
        setProgress(0);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('File type not supported. Allowed: images, MP4, PDF.');
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`File must be under ${MAX_SIZE_MB}MB.`);
            return;
        }

        if (file.type.startsWith('image/')) {
            setPreview(URL.createObjectURL(file));
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // ask backend to upload file to R2
            const { data } = await axios.post(
                'http://localhost:3000/api/upload/upload',
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (e) => {
                    if (e.total) {
                        setProgress(Math.round((e.loaded / e.total) * 100));
                    }
                    }
                }
            );

            // pass the fileKey back to the parent to save with the post
            onUploadComplete({ fileKey: data.fileKey, fileType: data.fileType, fileName: data.fileName });
        } catch (err) {
            setError('Upload failed. Please try again.');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    }, [onUploadComplete]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) 
            uploadFile(file);
    }, [uploadFile]);

    return (
        <div
            
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
                border: '2px dashed #ccc',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                marginTop: '8px',
                cursor: 'pointer',
            }}
        >
            <input 
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="file-input"
            />
            <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                {uploading ? (
                    <div>
                        <p>Uploading... {progress}%</p>
                        <progress value={progress} max={100} style={{ width: '100%' }} />
                    </div>
                ) : (
                    <p>Drag & drop a file, or <span style={{ color: '#0066cc' }}>click to browse</span></p>
                )}
            </label>

            {preview && (
                <img src={preview} alt="Preview" style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '150px' }} />
            )}

            {error && <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>}
        </div>
    );
}