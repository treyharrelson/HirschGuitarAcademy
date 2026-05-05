import React, {useEffect, useState } from 'react';
import api from '../../api/axiosInstance';

interface Block {
  type: 'text' | 'image' | 'video';
  content?: string; // HTML from Quill
  url?: string;     // Cloudflare R2 URL or YouTube URL
}

const R2_FOLDERS = ['forum/', 'course-thumbnails/', 'lecture-content/', 'profile-pictures/', 'badges/'];
const isFileKey = (val: string) => R2_FOLDERS.some(p => val.startsWith(p));

// Resolves an R2 fileKey to a presigned URL, or passes external URLs through
const useResolvedUrl = (rawUrl: string | undefined) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');

  useEffect(() => {
    if (!rawUrl) { setResolvedUrl(''); return; }
    if (isFileKey(rawUrl)) {
      api.get('/api/upload/file-url', { params: { fileKey: rawUrl } })
        .then(res => setResolvedUrl(res.data.presignedUrl))
        .catch(() => setResolvedUrl(''));
    } else {
      setResolvedUrl(rawUrl);
    }
  }, [rawUrl]);

  return resolvedUrl;
};

const ImageBlock: React.FC<{ url?: string }> = ({ url }) => {
  const src = useResolvedUrl(url);
  if (!src) return <div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse" />;
  return (
    <div className="w-full flex justify-center">
      <img
        src={src}
        alt="Lecture content"
        className="rounded-xl shadow-lg max-h-[600px] object-contain"
      />
    </div>
  );
};

const VideoBlock: React.FC<{ url?: string }> = ({ url }) => {
  const src = useResolvedUrl(url);
  // Logic to check if it's YouTube or R2
  const isYouTube = src?.includes('youtube.com') || src?.includes('youtu.be');

  if (!src) return <div className="w-full aspect-video bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
      {isYouTube ? (
        <iframe
          className="w-full h-full"
          src={src.replace('watch?v=', 'embed/')}
          title="YouTube video"
          allowFullScreen
        />
      ) : (
        <video src={src} controls className="w-full h-full" />
      )}
    </div>
  );
};

const LectureContentRenderer: React.FC<{ blocks: Block[] }> = ({ blocks }) => {
  if (!blocks || blocks.length === 0) {
    return <p className="text-gray-400 italic">This lecture has no content yet.</p>;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto py-8">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'text':
            return (
              <div 
                key={index} 
                className="prose prose-blue max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: block.content || '' }} 
              />
            );
          
          case 'image':
            return <ImageBlock key={index} url={block.url} />;
          case 'video':
            return <VideoBlock key={index} url={block.url} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default LectureContentRenderer;