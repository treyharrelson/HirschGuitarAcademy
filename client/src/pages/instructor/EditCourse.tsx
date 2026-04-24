import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useCourseEditor } from '../../hooks/useCourseEditor';
import { useAppContext } from '../../context/AppContext';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { assets } from '../../assets/assets';
import LectureBlocksContainer from '../../components/instructor/LectureBlockContainer';
import { DndContext, closestCenter, type DragEndEvent, pointerWithin, closestCorners, type DragOverEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { SortableModuleWrapper } from '../../components/instructor/SortableModuleWrapper';
import type { Module, Lecture } from '../../types/course';
import MediaBlockEditor from '../../components/instructor/MediaBlockEditor';
import { EmptyDropZone } from '../../components/generic/EmptyDropZone';
import {
    rectIntersection,
    getFirstCollision,
    type CollisionDetection
} from '@dnd-kit/core';

const EditCourse: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { state, setters, handlers, refs } = useCourseEditor();
    const { allCourses } = useAppContext();

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }

    const handleDragCancel = () => {
        setActiveId(null);
    };

    // This function filters targets so the mouse "sees through" layers
    const smartCollisionDetection: CollisionDetection = (args) => {
        const { active } = args;
        const activeId = active?.id ? String(active.id) : '';

        // 1. Filter targets: If dragging a block, only see block zones. 
        // If dragging a lecture, only see organizational zones.
        const filteredContainers = args.droppableContainers.filter((container) => {
            const id = String(container.id);
            if (activeId.startsWith('block-')) return id.includes('block');
            if (activeId.startsWith('lec-')) return !id.includes('block');
            return true;
        });

        // 2. Prioritize what's directly under the pointer
        const collisions = pointerWithin({
            ...args,
            droppableContainers: filteredContainers,
        });

        return collisions.length > 0
            ? collisions
            : rectIntersection({ ...args, droppableContainers: filteredContainers });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;
        if (typeof setActiveId === 'function') setActiveId(null);
        if (!over || active.id === over.id) return;

        setters.setModules((prev: Module[]) => {
            const newModules: Module[] = JSON.parse(JSON.stringify(prev));
            const activeId = String(active.id);
            const overId = String(over.id);

            const isBlock = activeId.startsWith('block-');
            const isOrg = activeId.startsWith('lec-') || activeId.startsWith('sub-');
            const isMod = activeId.startsWith('mod-');

            const clean = (id: string) =>
                id.replace(/^(mod-|sub-|lec-|block-|void-top-mod-root-|void-bottom-mod-root-|void-top-org-mod-|void-top-org-sub-|void-top-lec-sub-|void-top-block-lec-|void-after-mod-|void-after-org-|void-after-lec-|void-after-block-|void-bottom-mod-root-|void-bottom-org-mod-|void-bottom-org-sub-|void-bottom-lec-sub-|void-bottom-block-lec-|void-top-|void-after-|void-)/, '');

            const activeIdClean = clean(activeId);
            const overIdClean = clean(overId);

            let draggedItem: any = null;

            // 1. REMOVE (Unchanged)
            const findAndRemove = (list: any[]): boolean => {
                if (!Array.isArray(list)) return false;
                for (let i = 0; i < list.length; i++) {
                    if (String(list[i].id) === activeIdClean) {
                        draggedItem = list.splice(i, 1)[0]; // Extract the object correctly
                        return true;
                    }
                    if (findAndRemove(list[i].content)) return true;
                    if (findAndRemove(list[i].blocks)) return true;
                }
                return false;
            };

            // 2. INSERT (Depth-First Priority)
            const findAndInsert = (list: any[], listType: 'root' | 'org' | 'blocks'): boolean => {
                if (!Array.isArray(list)) return false;

                for (const item of list) {
                    if (item.content && findAndInsert(item.content, 'org')) return true;
                    if (item.blocks && findAndInsert(item.blocks, 'blocks')) return true;
                }

                // --- STEP B: VOID ZONE TARGETS ---
                if (overId.includes('void')) {
                    // Root Bottom/Top
                    if (overId.includes('mod-root') && listType === 'root') {
                        overId.includes('top') ? list.unshift(draggedItem) : list.push(draggedItem);
                        return true;
                    }

                    // Specific Container Voids (Dropping into empty Module/Sub-module/Lecture)
                    for (let item of list) {
                        if (String(item.id) === overIdClean) {
                            if (isBlock && 'blocks' in item) {
                                if (!Array.isArray(item.blocks)) item.blocks = [];
                                overId.includes('top') ? item.blocks.unshift(draggedItem) : item.blocks.push(draggedItem);
                                return true;
                            }
                            if (isOrg && 'content' in item) {
                                if (!Array.isArray(item.content)) item.content = [];
                                overId.includes('top') ? item.content.unshift(draggedItem) : item.content.push(draggedItem);
                                return true;
                            }
                        }
                    }

                    // Neighbor Voids (Dropping in between items)
                    const nIdx = list.findIndex(item => String(item.id) === overIdClean);
                    if (nIdx !== -1) {
                        if ((isBlock && listType === 'blocks') || (isOrg && listType === 'org') || (isMod && listType === 'root')) {
                            list.splice(nIdx + 1, 0, draggedItem);
                            return true;
                        }
                    }
                }

                // --- STEP C: DIRECT CARD DROP ---
                const idx = list.findIndex(item => String(item.id) === overIdClean);
                if (idx !== -1 && !overId.includes('void')) {
                    const targetItem = list[idx];

                    // Nesting into a card's header
                    if (isOrg && 'content' in targetItem) {
                        targetItem.content.push(draggedItem);
                        return true;
                    }

                    // Swapping same-level cards
                    if ((isBlock && listType === 'blocks') || (isOrg && listType === 'org') || (isMod && listType === 'root')) {
                        list.splice(delta.y > 0 ? idx + 1 : idx, 0, draggedItem);
                        return true;
                    }
                }

                return false;
            };

            if (findAndRemove(newModules)) {
                if (findAndInsert(newModules, 'root')) return newModules;
            }
            return prev;
        });
    };

    useEffect(() => {
        const fetchAndPopulate = async () => {
            try {
                const res = await api.get(`/api/courses/${courseId}`, { withCredentials: true });
                const course = res.data;
                setters.setCourseTitle(course.name);
                setters.setIsPrivate(course.isPrivate);
                setters.setModules(course.modules || []);
                setters.setImage(course.thumbnail);
                setters.setCourseDescription(course.description || "");
                setters.setCourseRequirements(course.requirements ? course.requirements.map((r: any) => String(r.id)) : []);
            } catch (err) {
                setStatusMsg("Error loading course data.");
            } finally {
                setLoading(false);
            }
        };
        if (courseId) fetchAndPopulate();
    }, [courseId]);

    useEffect(() => {
        if (!loading && refs.editorRef.current && !refs.quillRef.current) {
            const quill = new Quill(refs.editorRef.current, {
                theme: 'snow',
                modules: { toolbar: true }
            });
            refs.quillRef.current = quill;
            if (state.courseDescription) {
                quill.root.innerHTML = state.courseDescription;
            }
            quill.on('text-change', () => {
                setters.setCourseDescription(quill.root.innerHTML);
            });
        }
    }, [loading]);

    useEffect(() => {
        if (state.showPopup) {
            refs.inputRef.current?.focus();
        }
    }, [state.showPopup])

    useEffect(() => {
        if (statusMsg) {
            const timer = setTimeout(() => setStatusMsg(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    const handleUpdate = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSubmitting(true);
        setStatusMsg('');
        const descriptionHtml = refs.quillRef.current ? refs.quillRef.current.root.innerHTML : '';
        const payload = {
            name: state.courseTitle,
            description: descriptionHtml,
            thumbnail: state.image,
            modules: state.modules.map(mod => ({
                ...mod,
                id: typeof mod.id === 'string' ? parseInt(mod.id.replace('mod-', '')) : mod.id,
                content: mod.content?.map((item: any) => ({
                    ...item,
                    blocks: item.blocks || [],
                    id: typeof item.id === 'string'
                        ? parseInt(item.id.replace('lec-', '').replace('sub-', ''))
                        : item.id,
                    content: Array.isArray(item.content)
                        ? item.content.map((subLec: any) => ({
                            ...subLec,
                            blocks: subLec.blocks || [],
                            id: typeof subLec.id === 'string'
                                ? parseInt(subLec.id.replace('lec-', '').replace('sub-', ''))
                                : subLec.id
                        }))
                        : undefined
                }))
            })),
            requirements: state.courseRequirements,
        };
        try {
            const response = await api.put(`/api/courses/${courseId}`, payload);
            if (response.status === 200) {
                if (response.data.modules) {
                    setters.setModules(response.data.modules);
                } else {
                    window.location.reload();
                }
                setStatusMsg('Course saved successfully!');
            }
        } catch (err: any) {
            // Detailed error logging
            console.error("Save failed response:", err.response?.data);
            setStatusMsg(err.response?.data?.message || 'Failed to update course.');
        } finally {
            setSubmitting(false);
        }
    };
    if (loading) return <div className="p-10">Loading Course Editor...</div>;
    return (
        <div className='h-screen overflow-scroll flex flex-col items-start md:p-8 p-4 pt-8'>
            <form onSubmit={handleUpdate} className='flex flex-col gap-6 w-full max-w-4xl text-gray-500 pb-20'>
                <h1 className='text-2xl font-bold text-black'>Editing: {state.courseTitle}</h1>
                {/* COURSE TITLE */}
                <div className='flex flex-col gap-1'>
                    <p className='font-medium'>Course Title</p>
                    <input
                        onChange={e => setters.setCourseTitle(e.target.value)}
                        value={state.courseTitle}
                        type="text"
                        className='outline-none py-2 px-3 rounded border border-gray-400 text-black'
                    />
                </div>
                {/* MAIN DESCRIPTION */}
                <div className='flex flex-col gap-1'>
                    <p className='font-medium'>Course Description</p>
                    <div className='w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden'>
                        <div ref={refs.editorRef} className="bg-white min-h-[200px]"></div>
                    </div>
                </div>
                {/* COURSE THUMBNAIL */}
                <div className='flex flex-col gap-2 mb-6'>
                    <p className='font-bold text-gray-700'>Course Thumbnail</p>

                    <div className="max-w-md aspect-video overflow-hidden rounded-lg border border-gray-200">
                        <MediaBlockEditor
                            key={Image ? 'preview' : 'input'} // This forces a full UI reset
                            type="image"
                            url={typeof state.image === 'string' ? state.image : assets.defaultCourseThumbnail}
                            onUploadSuccess={(url) => {
                                setters.setImage(url);
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                        Recommended: 16:9 aspect ratio (800x450px)
                    </p>
                </div>
                {/* COURSE REQUIREMENTS */}
                <div className='flex flex-col gap-2'>
                    <p className='font-bold text-gray-700'>Course Prerequisites</p>
                    {/* The Flex-Wrap container makes them sit side-by-side */}
                    <div className='flex flex-wrap gap-2 w-full'>
                        {allCourses
                            // 1. Filter out the current course so it can't be a prerequisite of itself
                            .filter(course => String(course.id) !== String(courseId))
                            .map(course => {
                                const isChecked = state.courseRequirements.includes(String(course.id));

                                return (
                                    <label
                                        key={course.id}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer text-sm font-medium ${isChecked
                                            ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}>
                                        <input
                                            type='checkbox'
                                            className="hidden"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setters.setCourseRequirements([...state.courseRequirements, String(course.id)]);
                                                } else {
                                                    setters.setCourseRequirements(state.courseRequirements.filter(id => id !== String(course.id)));
                                                }
                                            }} />
                                        {isChecked && <span>✓</span>}
                                        {course.name}
                                    </label>
                                );
                            })
                        }
                        {/* Fallback if no OTHER courses exist */}
                        {allCourses.filter(c => String(c.id) !== String(courseId)).length === 0 && (
                            <p className='text-sm text-gray-400 italic'>No other courses available</p>
                        )}
                    </div>
                </div>
                {/* MODULES & LECTURES */}
                <DndContext
                    collisionDetection={smartCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}>
                    <div className='flex flex-col gap-4'>
                        <p className='font-bold text-lg text-black'>Course Content</p>
                        <SortableContext
                            id="root-modules"
                            items={state.modules?.map(m => `mod-${m.id}`) || []}
                            strategy={verticalListSortingStrategy}
                        >
                            <EmptyDropZone id="void-top-mod-root" />

                            {state.modules?.map((module: any, mIdx: number) => {
                                // 1. Generate IDs for the Module's content (Sub-modules and Lectures)
                                const allContentIds = module.content?.map((item: any) =>
                                    Array.isArray(item.content) ? `sub-${item.id}` : `lec-${item.id}`
                                ) || [];

                                return (
                                    <React.Fragment key={`frag-${module.id}`}>
                                        <SortableModuleWrapper id={`mod-${module.id}`}>
                                            <div className='bg-white border border-gray-300 rounded-lg p-4 mb-4 shadow-sm'>
                                                {/* Module Header */}
                                                <div className="flex items-center gap-3 p-4 bg-gray-50 border-b rounded-t-lg">
                                                    <span className="font-bold text-black">{mIdx + 1}.</span>
                                                    <input
                                                        className="font-bold text-black w-full bg-transparent outline-none"
                                                        value={module.title}
                                                        onChange={(e) => handlers.updateTitle('module', module.id, e.target.value)}
                                                    />
                                                    <img src={assets.cross_icon} className="w-4 h-4 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handlers.handleModule('remove', module.id)} />
                                                </div>

                                                {/* Nested Content Area */}
                                                <div className="flex flex-col gap-6 ml-6 mt-4">
                                                    <SortableContext id={`content-${module.id}`} items={allContentIds} strategy={verticalListSortingStrategy}>

                                                        <EmptyDropZone id={`void-top-org-mod-${module.id}`} />
                                                        {module.content?.map((item: any, lIdx: number) => {
                                                            const isSubModule = Array.isArray(item.content);

                                                            // SUB-MODULE RENDER
                                                            if (isSubModule) {
                                                                return (
                                                                    <React.Fragment key={item.id}>
                                                                        <SortableModuleWrapper id={`sub-${item.id}`}>

                                                                            <div className="p-4 border-l-4 border-blue-400 bg-blue-50/20 rounded-r-lg mb-4">
                                                                                <div className="flex items-center justify-between p-3 bg-blue-50/50">
                                                                                    <div className="flex items-center gap-3 flex-grow">
                                                                                        <img
                                                                                            onClick={() => handlers.handleSubModule('toggle', module.id, lIdx)}
                                                                                            src={assets.dropDown_icon}
                                                                                            className={`w-3.5 h-3.5 cursor-pointer transition-transform ${item.collapsed ? "-rotate-90" : "rotate-0"}`}
                                                                                        />
                                                                                        <div className="flex flex-col flex-grow">
                                                                                            <p className="text-[10px] text-blue-500 uppercase font-black">Sub-Module</p>
                                                                                            <input
                                                                                                className="font-bold text-gray-800 bg-transparent border-b border-blue-200 outline-none w-full"
                                                                                                value={item.title}
                                                                                                onChange={(e) => handlers.updateTitle('submodule', item.id, e.target.value, { moduleId: module.id, subModuleIndex: lIdx })}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <img src={assets.cross_icon} className='w-4 h-4 cursor-pointer opacity-50 hover:opacity-100' onClick={() => handlers.handleSubModule('remove', module.id, lIdx)} />
                                                                                </div>

                                                                                {/* Sub-Lectures Map */}
                                                                                {!item.collapsed && (
                                                                                    <div className="flex flex-col gap-4 ml-4 mt-2">
                                                                                        <SortableContext items={item.content.map((sl: any) => `lec-${sl.id}`)} strategy={verticalListSortingStrategy}>
                                                                                            <EmptyDropZone id={`void-top-lec-sub-${item.id}`} />
                                                                                            {item.content.map((subLec: any) => (
                                                                                                <React.Fragment key={subLec.id}>
                                                                                                    <SortableModuleWrapper id={`lec-${subLec.id}`}>
                                                                                                        <div className="p-3 bg-white border rounded shadow-sm">
                                                                                                            <div className="flex justify-between items-start mb-2">
                                                                                                                <div className="flex flex-col flex-1">
                                                                                                                    <p className="text-xs text-gray-400 uppercase font-bold">Lecture</p>
                                                                                                                    <input className="font-medium text-blue-600 bg-transparent outline-none w-full" value={item.title} onChange={(e) => handlers.updateTitle('lecture', item.id, e.target.value, { moduleId: module.id })} />
                                                                                                                </div>
                                                                                                                <img src={assets.cross_icon} className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 p-1" onClick={() => handlers.handleLecture('remove', module.id, lIdx)} />
                                                                                                            </div>
                                                                                                            <LectureBlocksContainer lectureId={subLec.id} initialBlocks={subLec.blocks || []} onBlocksChange={(newBlocks) => handlers.updateLectureBlocks(module.id, subLec.id, newBlocks)} />
                                                                                                        </div>

                                                                                                    </SortableModuleWrapper>
                                                                                                    <EmptyDropZone id={`void-after-lec-${subLec.id}`} />
                                                                                                </React.Fragment>
                                                                                            ))}
                                                                                            <EmptyDropZone id={`void-bottom-lec-sub-${item.id}`} />
                                                                                            <button type="button" className="text-blue-500 text-xs font-bold mt-2" onClick={() => handlers.handleLecture('add', module.id, lIdx)}>+ Add Sub-Lecture</button>
                                                                                        </SortableContext>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </SortableModuleWrapper>
                                                                        <EmptyDropZone id={`void-after-org-${item.id}`} />
                                                                    </React.Fragment>
                                                                );
                                                            }

                                                            // B. STANDARD LECTURE RENDER
                                                            return (
                                                                <React.Fragment key={item.id}>
                                                                    <SortableModuleWrapper id={`lec-${item.id}`}>
                                                                        <div className="p-4 bg-gray-50 rounded border mb-4 shadow-sm">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <div className="flex flex-col flex-1">
                                                                                    <p className="text-xs text-gray-400 uppercase font-bold">Lecture</p>
                                                                                    <input className="font-medium text-blue-600 bg-transparent outline-none w-full" value={item.title} onChange={(e) => handlers.updateTitle('lecture', item.id, e.target.value, { moduleId: module.id })} />
                                                                                </div>
                                                                                <img src={assets.cross_icon} className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 p-1" onClick={() => handlers.handleLecture('remove', module.id, lIdx)} />
                                                                            </div>
                                                                            <LectureBlocksContainer lectureId={item.id} initialBlocks={item.blocks || []} onBlocksChange={(newBlocks) => handlers.updateLectureBlocks(module.id, item.id, newBlocks)} />
                                                                        </div>
                                                                    </SortableModuleWrapper>
                                                                    <EmptyDropZone id={`void-after-org-${item.id}`} />
                                                                </React.Fragment>
                                                            );
                                                        })}

                                                        {/* Footer Buttons */}
                                                        <div className="flex gap-4 mt-2 border-t pt-4">
                                                            <button type="button" className="bg-gray-100 px-3 py-1 rounded text-sm font-semibold" onClick={() => handlers.handleLecture('add', module.id)}>+ Add Lecture</button>
                                                            <button type="button" className="bg-gray-100 px-3 py-1 rounded text-sm font-semibold" onClick={() => handlers.handleSubModule('add', module.id)}>+ Add Sub-Module</button>
                                                        </div>
                                                        {module.content.length === 0 && <EmptyDropZone id={`void-bottom-org-mod-${module.id}`} />}
                                                    </SortableContext>
                                                </div>
                                            </div>
                                        </SortableModuleWrapper>
                                        <EmptyDropZone id={`void-after-mod-${module.id}`} />
                                    </React.Fragment>
                                );
                            })}

                            <EmptyDropZone id="void-bottom-mod-root" />
                        </SortableContext>

                        <button
                            type="button"
                            className="w-full py-4 bg-blue-100 text-blue-600 font-bold rounded-lg border-2 border-dashed border-blue-300"
                            onClick={() => { setters.setPopupType('Module'); handlers.handleModule('add') }}>
                            + Add New Module
                        </button>
                        {/* CONTENT TITLE POPUP */}
                        {state.showPopup && (
                            <div className='fixed inset-0 flex items-center justify-center bg-gray-800/50 z-[100]'>
                                <div className='bg-white text-gray-700 p-4 rounded relative w-full max-w-80 z-[101]'>
                                    <h2 className='text-lg font-semibold mb-4'>Add {state.popupType}</h2>
                                    <div className='mb-2'>
                                        <p>{state.popupType} Title</p>
                                        <input
                                            ref={refs.inputRef}
                                            type='text'
                                            className='mt-1 block w-full border rounded py-1 px-2'
                                            value={state.lectureDetails.lectureTitle}
                                            onChange={(e) => setters.setLectureDetails({ ...state.lectureDetails, lectureTitle: e.target.value })}
                                            // Prevent form submission by pressing the ENTER key
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();  // Prevents the form from submitting/refreshing
                                                    handlers.handleLecture('save');
                                                }
                                            }} />
                                    </div>
                                    <button onClick={() => handlers.handleLecture('save')} type='button' className='w-full bg-blue-400 text-white px-4 py-2 rounded cursor-pointer'>Add</button>
                                    <img onClick={() => setters.setPopup(false)} src={assets.cross_icon} alt='cross icon' className='absolute top-4 right-4 w-4 h-4 cursor-pointer' />
                                </div>
                            </div>
                        )}
                    </div>
                    <DragOverlay adjustScale={true}>
                        {activeId ? (
                            <div className="w-[600px] pointer-events-none shadow-2xl scale-105 opacity-95">
                                <div className="bg-white border-2 border-blue-500 rounded-lg p-4 rotate-1">
                                    <div className="flex items-center gap-3">
                                        <div className="text-gray-400">⠿</div>
                                        <div>
                                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">
                                                {/* STRICT PASSPORT CHECK */}
                                                {activeId.startsWith('mod-') && "Moving Module"}
                                                {activeId.startsWith('sub-') && "Moving Sub-Module"}
                                                {activeId.startsWith('lec-') && "Moving Lecture"}
                                                {activeId.startsWith('block-') && "Moving Content Block"}
                                            </p>
                                            <h4 className="font-bold text-gray-800">
                                                {/* You can add logic here to find the actual title from state */}
                                                Relocating item...
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
                {/* SUBMIT */}
                <div className="flex items-center gap-4">
                    <button
                        type='submit'
                        disabled={submitting}
                        className='bg-blue-600 text-white py-3 px-10 rounded font-bold hover:bg-blue-700 disabled:opacity-50'>
                        {submitting ? 'Saving...' : 'SAVE CHANGES'}
                    </button>
                    {statusMsg && (
                        <p className={statusMsg.includes('success') ? 'text-green-600' : 'text-red-500'}>{statusMsg}</p>
                    )}
                </div>
            </form >
        </div >
    );
};
export default EditCourse;