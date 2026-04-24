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

  // 1. Identify types: Is a Lecture being dragged? Is THIS item a Sub-module?
  const isDraggingLecture = activeId.startsWith('lec-');
  const isThisItemSubmodule = thisId.startsWith('sub-') || thisId.startsWith('mod-');

  // 2. Determine if we should "Freeze" this item in place
  // We freeze Sub-modules when dragging Lectures so they act as static landing pads
  const shouldFreeze = isDraggingLecture && isThisItemSubmodule;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id,
    // Disable sorting logic for this item if it should be frozen
    disabled: shouldFreeze
  });

  const style: React.CSSProperties = {
    // 3. Physics Lock: If frozen, force transform to undefined (0,0)
    transform: shouldFreeze ? undefined : CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0 : 1, // Hide the original being dragged
    position: 'relative',

    // 4. Piercing: Allow mouse to hit zones inside this card
    pointerEvents: (active && !isDragging) ? 'none' : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <div className="relative group w-full pointer-events-auto">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-4 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"
        >
          ⠿
        </div>
        {children}
      </div>
    </div>
  );
};
