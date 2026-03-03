import { useFileUrl } from '../hooks/useFileUrl';

interface FileAttachmentProps {
    fileKey: string;
    fileType: string;
    fileName: string;
}

export default function FileAttachment({ fileKey, fileType, fileName }: FileAttachmentProps) {
    const { url, loading, error } = useFileUrl(fileKey);

    if (loading) return <p style={{ fontSize: '0.85em', color: '#888' }}>Loading attachment...</p>;
    if (error || !url) return <p style={{ color: 'red', fontSize: '0.85em' }}>Could not load attachment</p>;

    if (fileType.startsWith('image/')) {
        return (
            <img
                src={url}
                alt={fileName}
                style={{ maxWidth: '100%', borderRadius: '6px', marginTop: '8px' }}
            />
        );
    }

    if (fileType.startsWith('video/')) {
        return (
            <video controls style={{ maxWidth: '100%', marginTop: '8px' }}>
                <source src={url} type={fileType} />
                Your browser does not support video playback.
            </video>
        );
    }

    return (
        <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px' }}>
            📎{fileName}
        </a>
    );
}