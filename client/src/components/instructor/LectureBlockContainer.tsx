import React, { useState } from 'react';
import uniqid from 'uniqid';
import TextBlockEditor from './TextBlockEditor';
import MediaBlockEditor from './MediaBlockEditor';
import AddBlockMenu from './AddBlockMenu';
import type { ContentBlock, BlockType } from '../../types/course';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';


interface LectureBlocksContainerProps {
  initialBlocks: ContentBlock[];
  onBlocksChange: (blocks: ContentBlock[]) => void;
}

const LectureBlocksContainer: React.FC<LectureBlocksContainerProps> = ({
  initialBlocks,
  onBlocksChange
}) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks || []);

  const syncChange = (updatedBlocks: ContentBlock[]) => {
    setBlocks(updatedBlocks);
    onBlocksChange(updatedBlocks);
  };

  const addBlock = (type: BlockType) => {
    const newBlock = {
      id: uniqid(),
      type,
      order: blocks.length,
      ...(type === 'text' ? { body: '' } : { url: '' })
    } as ContentBlock;

    syncChange([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    const filtered = blocks.filter(b => b.id !== id);
    const reordered = filtered.map((b, i) => ({ ...b, order: i }));
    syncChange(reordered);
  };

  const updateBlockContent = (id: string, newContent: string) => {
    const updated = blocks.map(b => {
      if (b.id !== id) return b;
      return b.type === 'text' ? { ...b, body: newContent } : { ...b, url: newContent };
    });
    syncChange(updated);
  };

  // Drag-N-Drop functionality
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      // Reorder the array and update the 'order' property
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, i) => ({
        ...block,
        order: i,
      }));

      syncChange(newBlocks);
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 mt-4 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-300">
        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Lecture Content</p>

        {/* Existing Blocks */}
        <div className="flex flex-col gap-4">
          {blocks.map((block) => (
            <div key={block.id} className="relative group bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Delete Button (Top Right of block) */}
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50"
              >
                ×
              </button>

              {block.type === 'text' ? (
                <TextBlockEditor
                  id={block.id}
                  initialBody={block.body}
                  onChange={(val) => updateBlockContent(block.id, val)}
                />
              ) : (
                <MediaBlockEditor
                  type={block.type}
                  url={block.url}
                  onUploadSuccess={(url) => updateBlockContent(block.id, url)}
                />
              )}
            </div>
          ))}
        </div>

        {/* The Big Add Menu at the bottom */}
        <AddBlockMenu onAdd={addBlock} />
      </div>
    </DndContext>
  );
};

export default LectureBlocksContainer;