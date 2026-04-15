import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import "quill/dist/quill.snow.css";

interface LectureEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

const LectureEditor: React.FC<LectureEditorProps> = ({ initialContent, onContentChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);

  useEffect(() => {
    if (containerRef.current && !quillInstance.current) {
      // Initialize Quill only once per instance
      quillInstance.current = new Quill(containerRef.current, {
        theme: 'snow',
        modules: { toolbar: true }
      });

      // Set initial content if it exists
      if (initialContent) {
        quillInstance.current.root.innerHTML = initialContent;
      }

      // Listen for changes and send back to parent state
      quillInstance.current.on('text-change', () => {
        const content = quillInstance.current?.root.innerHTML || '';
        onContentChange(content);
      });
    }
  }, []);

  return <div ref={containerRef} className="bg-white" />;
};
export default LectureEditor