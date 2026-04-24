import React, { useEffect, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { EmptyDropZone } from '../generic/EmptyDropZone';
import { SortableModuleWrapper } from './SortableModuleWrapper';
import TextBlockEditor from './TextBlockEditor';
import MediaBlockEditor from './MediaBlockEditor';
import AddBlockMenu from './AddBlockMenu';
import { assets } from '../../assets/assets';
import type { ContentBlock, BlockType } from '../../types/course';
import uniqid from 'uniqid';

interface LectureBlocksContainerProps {
  initialBlocks: ContentBlock[];
  onBlocksChange: (blocks: ContentBlock[]) => void;
  lectureId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const LectureBlocksContainer: React.FC<LectureBlocksContainerProps> = ({ 
  initialBlocks, 
  onBlocksChange, 
  lectureId,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks || []);
  const { active } = useDndContext();
  const isGlobalDragging = !!active;

  useEffect(() => {
    if (initialBlocks) {
      setBlocks(initialBlocks);
    }
  }, [initialBlocks]);

  const syncChange = (updatedBlocks: ContentBlock[]) => {
    setBlocks(updatedBlocks);
    onBlocksChange(updatedBlocks);
  };

  const addBlock = (type: BlockType) => {
    const newBlock = { 
      id: uniqid(), 
      type, 
      order: blocks.length, 
      ...(type === 'text' ? { content: '' } : { url: '' }) 
    } as ContentBlock;
    syncChange([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    const filtered = blocks.filter(b => b.id !== id);
    syncChange(filtered);
  };

  const handleBlockUpdate = (id: string, newContent: string) => {
    const updated = blocks.map(b => {
      if (b.id !== id) return b;
      return b.type === 'text' ? { ...b, content: newContent } : { ...b, url: newContent };
    });
    syncChange(updated);
  };

  const blockSortableIds = blocks.map(b => `block-${b.id}`);

  return (
    <div className={`
      flex flex-col gap-2 mt-4 p-4 rounded-xl border border-dashed transition-all duration-300
      ${isGlobalDragging ? 'border-blue-200 bg-blue-50/5' : 'border-gray-200 bg-gray-50/50'}
      ${isCollapsed ? 'opacity-80' : 'opacity-100'}
    `}>
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer group select-none"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <img 
            src={assets.dropDown_icon} 
            alt="toggle"
            className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
          />
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
            Lecture Content {isCollapsed && `(${blocks.length} Blocks)`}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase pt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isCollapsed ? 'text-blue-500' : 'text-red-500'}`}>
          {isCollapsed ? 'Expand' : 'Collapse'}
        </span>
      </div>

      {!isCollapsed && (
        <>
          <div className={isGlobalDragging ? 'pointer-events-none' : 'pointer-events-auto'}>
            <SortableContext items={blockSortableIds} strategy={verticalListSortingStrategy}>
              <EmptyDropZone id={`void-top-block-lec-${lectureId}`} />
              <div className="flex flex-col gap-3">
                {blocks.map((block) => (
                  <React.Fragment key={block.id}>
                    <div className="pointer-events-auto">
                      <SortableModuleWrapper id={`block-${block.id}`}>
                        <div className="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} 
                            className="absolute top-2 right-2 bg-white text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-50">
                            ×
                          </button>
                          <div className="p-1">
                            {block.type === 'text' ? (
                              <TextBlockEditor id={block.id} initialBody={block.content || ''} onChange={(val) => handleBlockUpdate(block.id, val)} />
                            ) : (
                              <MediaBlockEditor type={block.type} url={block.url || ''} onUploadSuccess={(url) => handleBlockUpdate(block.id, url)} />
                            )}
                          </div>
                        </div>
                      </SortableModuleWrapper>
                    </div>
                    <EmptyDropZone id={`void-after-block-${block.id}`} />
                  </React.Fragment>
                ))}
              </div>
              {blocks.length === 0 && (
                <EmptyDropZone id={`void-bottom-block-lec-${lectureId}`} />
              )}
            </SortableContext>
          </div>
          <div className="mt-4 pointer-events-auto">
            <AddBlockMenu onAdd={addBlock} />
          </div>
        </>
      )}
    </div>
  );
};

export default LectureBlocksContainer;