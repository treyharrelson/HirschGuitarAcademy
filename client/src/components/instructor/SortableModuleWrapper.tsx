import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface SortableModuleWrapperProps {
  id: string;
  children: React.ReactNode;
}

export const SortableModuleWrapper: React.FC<SortableModuleWrapperProps> = ({ id, children }) => {
  const { active } = useDndContext();
  const activeId = active?.id ? String(active.id) : '';
  const thisId = String(id);
  const isDraggingSomething = !!activeId;
  const isCurrentlyBeingDragged = activeId === thisId;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isDraggingSomething && !isCurrentlyBeingDragged
  });

  const style: React.CSSProperties = {
    transform: isCurrentlyBeingDragged ? CSS.Translate.toString(transform) : undefined,
    transition,
    zIndex: isCurrentlyBeingDragged ? 9999 : 1,
    opacity: isCurrentlyBeingDragged ? 0 : 1,
    position: 'relative',
    pointerEvents: isCurrentlyBeingDragged ? 'none' : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full relative">
      <div
        className={`relative group w-full ${isDraggingSomething && !isCurrentlyBeingDragged
          ? 'pointer-events-none'
          : 'pointer-events-auto'
          }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-4 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 pointer-events-auto z-[100]"
        >
          ⠿
        </div>
        <div className="pointer-events-auto relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};