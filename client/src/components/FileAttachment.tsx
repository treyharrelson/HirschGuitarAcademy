import { useFileUrl } from '../hooks/useFileUrl';
import { useState} from 'react';

interface FileAttachmentProps {
    fileKey: string;
    fileType: string;
    fileName: string;
}

function getYoutubeId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=)([^#&?]{11})/);
    return match ? match[1] : null;
}

export default function FileAttachment({ fileKey, fileType, fileName }: FileAttachmentProps) {
    const { url, loading, error } = useFileUrl(fileKey);
    const [ expanded, setExpanded] = useState(false);
    const [videoReady, setVideoReady] = useState(false);

    if (loading) return <p style={{ fontSize: '0.85em', color: '#888' }}>Loading attachment...</p>;
    if (error || !url) return <p style={{ color: 'red', fontSize: '0.85em' }}>Could not load attachment</p>;

    // handle external link
    if (fileType === 'link/external') {
        const ytId = getYoutubeId(url);
        if (ytId) {
            return (
                <div className="mt-3 w-full">
                    <iframe
                        className="w-full aspect-video rounded-lg shadow-md"
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title="YouTube video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }
        return (
            <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px' }}>
                🔗 {url}
            </a>
        );
    }

    if (fileType.startsWith('image/')) {
        return (
            <div style={{ marginTop: '8px', display: 'inline-block' }}>
                <img
                    src={url}
                    alt={fileName}
                    loading="lazy"
                    onClick={() => setExpanded(prev => !prev)}
                    style={{
                        display: 'block',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        ...(expanded
                            ? { maxWidth: '100%', maxHeight: 'none' }
                            : { width: '120px', height: '90px', objectFit:'cover' }
                        ),
                    }}
                    title={expanded ? 'Click to collapse' : 'Click to expand'}
                />
                <button
                    onClick={() => setExpanded(prev => !prev)}
                    style={{
                        display: 'block',
                        marginTop: '4px',
                        fontSize: '0.75em',
                        color: '#0066cc',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                    }}
                >
                    {expanded ? '▲ Collapse' : '▼ Expand'}
                </button>
            </div>
        );
    }

    if (fileType.startsWith('video/')) {
        return (
            <div style={{ marginTop: '8px' }}>
                {!videoReady ? (
                    <button
                        onClick={() => setVideoReady(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 14px',
                            background: '#111',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85em',
                        }}
                    >
                        ▶ {fileName}
                    </button>
                ) : (
                    <div>
                        <video controls style={{ maxWidth: '100%', marginTop: '8px' }}>
                            <source src={url} type={fileType} />
                            Your browser does not support video playback.
                        </video>
                        <button
                            onClick={() => setVideoReady(false)}
                            style={{
                                display: 'block',
                                marginTop: '4px',
                                fontSize: '0.75em',
                                color: '#0066cc',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            ▲ Collapse
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px' }}>
            📎{fileName}
        </a>
    );
}