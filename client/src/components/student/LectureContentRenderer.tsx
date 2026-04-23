import React from 'react';

interface Block {
  type: 'text' | 'image' | 'video';
  content?: string; // HTML from Quill
  url?: string;     // Cloudflare R2 URL or YouTube URL
}

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
            return (
              <div key={index} className="w-full flex justify-center">
                <img 
                  src={block.url} 
                  alt="Lecture content" 
                  className="rounded-xl shadow-lg max-h-[600px] object-contain" 
                />
              </div>
            );
          
          case 'video':
            // Logic to check if it's YouTube or R2
            const isYouTube = block.url?.includes('youtube.com') || block.url?.includes('youtu.be');
            
            return (
              <div key={index} className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                {isYouTube ? (
                  <iframe
                    className="w-full h-full"
                    src={block.url?.replace("watch?v=", "embed/")}
                    title="YouTube video"
                    allowFullScreen
                  />
                ) : (
                  <video src={block.url} controls className="w-full h-full" />
                )}
              </div>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
};

export default LectureContentRenderer;