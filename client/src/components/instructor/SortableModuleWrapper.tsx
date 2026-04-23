import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableModuleWrapper = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle: Place this icon inside your Module Header */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute -left-6 top-6 cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 text-gray-400"
      >
        ⠿
      </div>
      {children}
    </div>
  );
};
