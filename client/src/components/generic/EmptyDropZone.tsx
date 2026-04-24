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
    const isDraggingOrg = activeId?.startsWith('lec-') || activeId?.startsWith('sub-');
    const isDraggingMod = activeId?.startsWith('mod-');
    const isTargetValid = !!activeId && (
        (isDraggingBlock && id.includes('block')) ||
        (isDraggingOrg && (id.includes('org') || id.includes('sub') || id.includes('lec') || id.includes('mod-root'))) ||
        (isDraggingMod && id.includes('mod-root'))
    );

    return (
        <div
            ref={setNodeRef}
            className={`
        w-full transition-all duration-300 ease-in-out relative
        /* PIERCING: valid zones sit on top of module backgrounds (z-50) */
        ${isTargetValid ? 'z-50 opacity-100' : 'z-0 opacity-0 pointer-events-none'} 
        
        /* Layout: 0px when idle -> 40px when dragging -> 80px when hovering */
        ${isTargetValid
                    ? isOver
                        ? 'h-20 my-4 px-2'
                        : 'h-10 my-1 px-4'
                    : 'h-0'
                }
      `}
        >
            <div
                className={`
          w-full h-full rounded-xl border-2 border-dashed 
          flex flex-col items-center justify-center transition-all duration-200
          pointer-events-none /* Ensures text doesn't block the mouse sensor */
          
          ${isOver
                        ? 'bg-blue-100 border-blue-600 scale-[1.01] shadow-lg'
                        : 'bg-gray-50/40 border-gray-300'
                    }
        `}
            >
                {isTargetValid && (
                    <>
                        <span className={`
              text-[10px] font-black uppercase tracking-widest transition-colors
              ${isOver ? 'text-blue-700' : 'text-gray-400'}
            `}>
                            {isOver ? 'Release to Drop' : 'Valid Target'}
                        </span>

                        {isOver && (
                            <div className="text-[9px] text-blue-500 font-bold mt-1 animate-pulse">
                                Inserting item here...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
