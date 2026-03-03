import { useState, useEffect } from 'react';
import axios from 'axios';

export function useFileUrl(fileKey: string | null) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!fileKey) 
            return;

        const fetchUrl = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get('http://localhost:3000/api/upload/file-url', {
                    params: { fileKey },
                    withCredentials: true,
                });
                setUrl(data.presignedUrl);
            } catch {
                setError('Could not load file');
            } finally {
                setLoading(false);
            }
        };

        fetchUrl();

        // refresh every 55 minutes before the 1 hour signed URL expires
        const interval = setInterval(fetchUrl, 55 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fileKey]);

    return {url, loading, error };
}