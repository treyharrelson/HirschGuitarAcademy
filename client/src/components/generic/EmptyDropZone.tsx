import React from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';

interface EmptyDropZoneProps {
    id: string;
}

export const EmptyDropZone: React.FC<EmptyDropZoneProps> = ({ id }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const { active } = useDndContext();
    const activeId = active?.id ? String(active.id) : null;

    const isDraggingBlock = activeId?.startsWith('block-');
    const isDraggingSub = activeId?.startsWith('sub-');
    const isDraggingLec = activeId?.startsWith('lec-');
    const isDraggingMod = activeId?.startsWith('mod-');

    const isTargetValid = !!activeId && (
        (isDraggingBlock && id.includes('block')) ||
        (isDraggingLec && (id.includes('org') || id.includes('sub'))) ||
        (isDraggingSub && (id.includes('mod-root') || id.includes('org') || id.includes('sub'))) ||
        (isDraggingMod && (id.includes('mod-root') || id.includes('org') || id.includes('sub')) && !id.includes('lec'))
    );

    return (
        <div
            ref={setNodeRef}
            className={`
                w-full transition-all duration-150 relative
                ${isTargetValid ? 'z- opacity-100 pointer-events-auto' : 'z-0 opacity-0 pointer-events-none'}
                ${isTargetValid ? (isOver ? 'h-24 py-2' : 'h-12 py-1') : 'h-0'}`}
        >
            <div className={`
        w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center 
        transition-all duration-200 pointer-events-none
        ${isOver ? 'bg-blue-100 border-blue-600 scale-[1.01] shadow-lg' : 'bg-gray-50/40 border-gray-300'}
      `}>
                {isTargetValid && (
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isOver ? 'text-blue-700' : 'text-gray-400'}`}>
                        {isOver ? 'Release to Drop' : 'Valid Target'}
                    </span>
                )}
            </div>
        </div>
    );
};
