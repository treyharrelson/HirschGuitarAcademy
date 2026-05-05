import React, { useEffect, useRef, useCallback } from 'react';
import Quill from 'quill';
import "quill/dist/quill.snow.css";

interface TextBlockEditorProps {
    id: string; // The block's uniqid
    initialBody: string;
    onChange: (content: string) => void;
}

const TextBlockEditor: React.FC<TextBlockEditorProps> = ({ id, initialBody, onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<Quill | null>(null);

    const handleTextChange = useCallback(() => {
        const html = quillInstance.current?.root.innerHTML || '';
        if (html !== initialBody) {
            onChange(html);
        }
    }, [onChange, initialBody]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = "";
            const editorContainer = document.createElement('div');
            containerRef.current.appendChild(editorContainer);
            quillInstance.current = new Quill(editorContainer, {
                theme: 'snow',
                modules: { toolbar: true }
            });
            if (initialBody) {
                quillInstance.current.root.innerHTML = initialBody;
            }
            quillInstance.current.on('text-change', handleTextChange);
        }
        return () => {
            if (quillInstance.current) {
                quillInstance.current.off('text-change', handleTextChange);
                quillInstance.current = null;
            }
        };
    }, [id]);


    return (
        <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div ref={containerRef} style={{ minHeight: '150px' }} />
        </div>
    );
};

export default TextBlockEditor;