import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useCourseEditor } from '../../hooks/useCourseEditor';
import { useAppContext } from '../../context/AppContext';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { assets } from '../../assets/assets';
import LectureBlocksContainer from '../../components/instructor/LectureBlockContainer';
import { DndContext, closestCenter, type DragEndEvent, pointerWithin, DragOverlay, type DragStartEvent, useSensors, useSensor, PointerSensor, type CollisionDetection, useDndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, type SortingStrategy } from '@dnd-kit/sortable';
import { SortableModuleWrapper } from '../../components/instructor/SortableModuleWrapper';
import type { Module } from '../../types/course';
import MediaBlockEditor from '../../components/instructor/MediaBlockEditor';
import { EmptyDropZone } from '../../components/generic/EmptyDropZone';

const EditCourse: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { state, setters, handlers, refs } = useCourseEditor();
    const { allCourses } = useAppContext();
    const { active } = useDndContext();
    const isGlobalDragging = !!active;

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

    const nullStrategy: SortingStrategy = () => null;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const customCollisionDetection: CollisionDetection = (args) => {
        const { active, droppableContainers, pointerCoordinates } = args;
        if (!pointerCoordinates) return [];
        const pointerCollisions = pointerWithin(args);
        const voidCollisions = pointerCollisions.filter(c => String(c.id).includes('void'));
        if (voidCollisions.length > 0) {
            const intersectingContainers = droppableContainers.filter(c =>
                voidCollisions.some(vc => vc.id === c.id)
            );
            return closestCenter({
                ...args,
                droppableContainers: intersectingContainers
            });
        }
        return closestCenter(args);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;
        const activeId = String(active.id);
        const overId = String(over.id);
        const clean = (id: string) => id.replace(/^(mod-|sub-|lec-|block-|void-top-mod-root-|void-bottom-mod-root-|void-top-org-mod-|void-top-org-sub-|void-top-lec-sub-|void-top-block-lec-|void-after-mod-|void-after-org-|void-after-lec-|void-after-block-|void-bottom-mod-root-|void-bottom-org-mod-|void-bottom-org-sub-|void-bottom-lec-sub-|void-bottom-block-lec-|void-top-|void-after-|void-)/, '');
        const overIdClean = clean(overId);
        setters.setModules((prev: Module[]) => {
            const newModules: Module[] = JSON.parse(JSON.stringify(prev));
            const isBlock = activeId.startsWith('block-');
            const isOrg = activeId.startsWith('lec-') || activeId.startsWith('sub-');
            const isMod = activeId.startsWith('mod-');
            const activeIdClean = clean(activeId);
            let draggedItem: any = null;
            const findAndRemove = (list: any[]): boolean => {
                if (!Array.isArray(list)) return false;
                for (let i = 0; i < list.length; i++) {
                    if (String(list[i].id) === activeIdClean) {
                        draggedItem = list.splice(i, 1)[0];
                        return true;
                    }
                    if (list[i].content && findAndRemove(list[i].content)) return true;
                    if (list[i].blocks && findAndRemove(list[i].blocks)) return true;
                }
                return false;
            };
            const findAndInsert = (list: any[], listType: 'root' | 'org' | 'blocks'): boolean => {
                if (!Array.isArray(list)) return false;
                if (overId === "void-bottom-mod-root" && listType === 'root') {
                    list.push(draggedItem);
                    return true;
                }
                if (overId.includes('void')) {
                    if (overId.includes('mod-root') && listType === 'root') {
                        const nIdx = list.findIndex(item => String(item.id) === overIdClean);
                        if (nIdx !== -1) {
                            list.splice(overId.includes('top') ? nIdx : nIdx + 1, 0, draggedItem);
                        } else {
                            overId.includes('top') ? list.unshift(draggedItem) : list.push(draggedItem);
                        }
                        return true;
                    }
                    for (let item of list) {
                        if (String(item.id) === overIdClean && overIdClean !== '') {
                            if (isMod && item.id.startsWith('lec-')) continue;
                            if ((isOrg || isMod) && 'content' in item) {
                                if (!Array.isArray(item.content)) item.content = [];
                                if (overId.includes('top')) {
                                    item.content.unshift(draggedItem);
                                } else {
                                    item.content.push(draggedItem);
                                }
                                return true;
                            }
                            if (isBlock && 'blocks' in item) {
                                if (!Array.isArray(item.blocks)) item.blocks = [];
                                if (overId.includes('top')) {
                                    item.blocks.unshift(draggedItem);
                                } else {
                                    item.blocks.push(draggedItem);
                                }
                                return true;
                            }
                        }
                    }
                    const nIdx = list.findIndex(item => String(item.id) === overIdClean);
                    if (nIdx !== -1 && overIdClean !== '') {
                        if ((isMod && listType === 'root') || (isOrg && listType === 'root') || (isOrg && listType === 'org') || (isMod && listType === 'org') || (isBlock && listType === 'blocks')) {
                            const insertIdx = overId.includes('top') ? nIdx : nIdx + 1;
                            list.splice(insertIdx, 0, draggedItem);
                            return true;
                        }
                    }
                }
                const idx = list.findIndex(item => String(item.id) === overIdClean);
                if (idx !== -1 && !overId.includes('void')) {
                    const targetItem = list[idx];
                    if (isMod && targetItem.id.startsWith('lec-')) return false;
                    if ((isOrg || isMod) && 'content' in targetItem) {
                        if (!Array.isArray(targetItem.content)) targetItem.content = [];
                        targetItem.content.push(draggedItem);
                        return true;
                    }
                    if ((isBlock && listType === 'blocks') || (isOrg && listType === 'org') || (isMod && listType === 'root') || (isOrg && listType === 'root')) {
                        list.splice(delta.y > 0 ? idx + 1 : idx, 0, draggedItem);
                        return true;
                    }
                }
                for (const item of list) {
                    if (item.content && findAndInsert(item.content, 'org')) return true;
                    if (item.blocks && findAndInsert(item.blocks, 'blocks')) return true;
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

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        // Simple call to the hook's validator
        const error = handlers.validateCourse();
        if (error) {
            setStatusMsg(`Cannot Save: ${error}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSubmitting(true);

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
                    id: typeof item.id === 'string' ? parseInt(item.id.replace('lec-', '').replace('sub-', '')) : item.id,
                    // Ensure blocks are carried over exactly as defined in your types
                    blocks: item.blocks || [],
                    content: Array.isArray(item.content) ? item.content.map((subLec: any) => ({
                        ...subLec,
                        blocks: subLec.blocks || [],
                        id: typeof subLec.id === 'string' ? parseInt(subLec.id.replace('lec-', '').replace('sub-', '')) : subLec.id
                    })) : undefined
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
            console.error("Save failed:", err.response?.data);
            setStatusMsg(err.response?.data?.message || 'Failed to update course.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10">Loading Course Editor...</div>;
    return (
        <div className='w-full pb-10 flex flex-col items-start md:p-8 p-4 pt-8'>
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
                            //key={Image ? 'preview' : 'input'} // This forces a full UI reset
                            type="image"
                            folder="course-thumbnails"
                            url={typeof state.image === 'string' ? state.image : assets.defaultCourseThumbnail}
                            onUploadSuccess={(fileKey) => {
                                setters.setImage(fileKey);
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
                    sensors={sensors}
                    collisionDetection={customCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}>
                    <div className='flex flex-col gap-4'>
                        <p className='font-bold text-lg text-black'>Course Content</p>
                        <SortableContext
                            id="root-modules"
                            items={state.modules?.map(m => `mod-${m.id}`) || []}
                            strategy={activeId?.startsWith('mod-') ? nullStrategy : verticalListSortingStrategy}>
                            <EmptyDropZone id="void-top-mod-root" />
                            {state.modules?.map((module: any) => {
                                const allContentIds = module.content?.map((item: any) =>
                                    Array.isArray(item.content) ? `sub-${item.id}` : `lec-${item.id}`
                                ) || [];
                                return (
                                    <React.Fragment key={`frag-${module.id}`}>
                                        <SortableModuleWrapper id={`mod-${module.id}`}>
                                            {/* MAIN CONTAINER: flex-col ensures stacking */}
                                            <div className='flex flex-col bg-white border border-gray-300 rounded-xl mb-4 shadow-sm overflow-hidden'>
                                                {/* CONSOLIDATED MODULE HEADER */}
                                                <div
                                                    className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors select-none group"
                                                    onClick={() => handlers.toggleItem(module.id)}>
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                                            Module {module.collapsed && `(${module.content.length} Items)`}
                                                        </p>
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={assets.dropDown_icon}
                                                                className={`w-3 h-3 transition-transform ${module.collapsed ? '-rotate-90' : ''}`} />
                                                            <div className="flex-1 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="text"
                                                                    value={module.title}
                                                                    onChange={(e) => handlers.updateTitle('module', module.id, e.target.value)}
                                                                    className="font-bold text-gray-800 bg-transparent outline-none w-full text-xl cursor-text" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-4">
                                                        <span className={`text-[10px] font-bold uppercase pt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${module.collapsed ? 'text-blue-500' : 'text-red-500'}`}>
                                                            {module.collapsed ? 'Expand' : 'Collapse'}
                                                        </span>
                                                        <img
                                                            src={assets.cross_icon}
                                                            className='w-4 h-4 cursor-pointer opacity-30 hover:opacity-100 transition-opacity'
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlers.handleModule('remove', module.id);
                                                            }} />
                                                    </div>
                                                </div>
                                                {/* NESTED CONTENT AREA: Stacks correctly below header */}
                                                {!module.collapsed && (
                                                    <div className={`m-4 mt-0 p-4 rounded-xl border border-dashed transition-colors ${isGlobalDragging ? 'border-blue-200 bg-blue-50/5' : 'border-gray-200 bg-gray-50/50'}`}>
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-4">Module Content</p>
                                                        <SortableContext id={`content-${module.id}`} items={allContentIds} strategy={verticalListSortingStrategy}>
                                                            <EmptyDropZone id={`void-top-org-mod-${module.id}`} />
                                                            {module.content?.map((item: any, lIdx: number) => {
                                                                const isSubModule = Array.isArray(item.content);
                                                                if (isSubModule) {
                                                                    return (
                                                                        <React.Fragment key={item.id}>
                                                                            <SortableModuleWrapper id={`sub-${item.id}`}>
                                                                                <div className="flex flex-col bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden shadow-sm">
                                                                                    {/* SUBMODULE HEADER */}
                                                                                    <div
                                                                                        className="flex items-start justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                                                                                        onClick={() => handlers.toggleItem(item.id)}>
                                                                                        <div className="flex flex-col gap-1 flex-1">
                                                                                            <p className="text-[9px] text-blue-500 uppercase font-black tracking-widest">
                                                                                                Sub-Module {item.collapsed && `(${item.content.length} Lectures)`}
                                                                                            </p>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <img
                                                                                                    src={assets.dropDown_icon}
                                                                                                    className={`w-2.5 h-2.5 transition-transform duration-200 ${item.collapsed ? "-rotate-90" : ""}`} />
                                                                                                <div
                                                                                                    className="flex-1 pointer-events-auto"
                                                                                                    onClick={(e) => e.stopPropagation()}>
                                                                                                    <input
                                                                                                        className="font-bold text-gray-700 bg-transparent outline-none w-full text-sm cursor-text"
                                                                                                        value={item.title}
                                                                                                        onChange={(e) => handlers.updateTitle('submodule', item.id, e.target.value, { moduleId: module.id, subModuleIndex: lIdx })} />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3 ml-4">
                                                                                            <span className={`text-[9px] font-bold uppercase pt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${item.collapsed ? 'text-blue-500' : 'text-red-500'}`}>
                                                                                                {item.collapsed ? 'Expand' : 'Collapse'}
                                                                                            </span>
                                                                                            <img
                                                                                                src={assets.cross_icon}
                                                                                                className='w-4 h-4 cursor-pointer opacity-30 hover:opacity-100 transition-opacity'
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handlers.handleSubModule('remove', module.id, lIdx);
                                                                                                }} />
                                                                                        </div>
                                                                                    </div>
                                                                                    {!item.collapsed && (
                                                                                        <div className={`m-3 p-3 rounded-lg border border-dashed ${isGlobalDragging ? 'border-blue-100 bg-blue-50/10' : 'border-gray-100 bg-gray-50/80'}`}>
                                                                                            <SortableContext items={item.content.map((sl: any) => `lec-${sl.id}`)} strategy={verticalListSortingStrategy}>
                                                                                                <EmptyDropZone id={`void-top-lec-sub-${item.id}`} />
                                                                                                {item.content.map((subLec: any) => (
                                                                                                    <React.Fragment key={subLec.id}>
                                                                                                        <SortableModuleWrapper id={`lec-${subLec.id}`}>
                                                                                                            <div className="bg-white border rounded-lg p-3 shadow-sm">
                                                                                                                <div className="flex justify-between items-start mb-2">
                                                                                                                    <div className="flex flex-col flex-1">
                                                                                                                        <p className="text-[9px] text-gray-400 uppercase font-bold">Lecture</p>
                                                                                                                        <input className="font-medium text-blue-600 bg-transparent outline-none w-full" value={subLec.title} onChange={(e) => handlers.updateTitle('lecture', subLec.id, e.target.value, { moduleId: module.id })} />
                                                                                                                    </div>
                                                                                                                    <img src={assets.cross_icon} className="w-4 h-4 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handlers.handleLecture('remove', module.id, lIdx, item.content.indexOf(subLec))} />
                                                                                                                </div>
                                                                                                                <LectureBlocksContainer lectureId={subLec.id} initialBlocks={subLec.blocks} isCollapsed={subLec.collapsed} onToggleCollapse={() => handlers.toggleItem(subLec.id)} onBlocksChange={(blocks) => handlers.updateLectureBlocks(subLec.id, blocks)} />
                                                                                                            </div>
                                                                                                        </SortableModuleWrapper>
                                                                                                        <EmptyDropZone id={`void-after-lec-${subLec.id}`} />
                                                                                                    </React.Fragment>
                                                                                                ))}
                                                                                                <EmptyDropZone id={`void-bottom-lec-sub-${item.id}`} />
                                                                                                <button type="button" className="text-blue-500 text-[10px] font-black uppercase mt-2 hover:underline" onClick={() => handlers.handleLecture('add', module.id, lIdx)}>+ Add Sub-Lecture</button>
                                                                                            </SortableContext>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </SortableModuleWrapper>
                                                                            <EmptyDropZone id={`void-after-org-${item.id}`} />
                                                                        </React.Fragment>
                                                                    );
                                                                }
                                                                {/* STANDARD LECTURE RENDER */ }
                                                                return (
                                                                    <React.Fragment key={item.id}>
                                                                        <SortableModuleWrapper id={`lec-${item.id}`}>
                                                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4 shadow-sm">
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <div className="flex flex-col flex-1">
                                                                                        <p className="text-[9px] text-gray-400 uppercase font-bold">Lecture</p>
                                                                                        <input className="font-medium text-blue-600 bg-transparent outline-none w-full" value={item.title} onChange={(e) => handlers.updateTitle('lecture', item.id, e.target.value, { moduleId: module.id })} />
                                                                                    </div>
                                                                                    <img src={assets.cross_icon} className="w-4 h-4 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handlers.handleLecture('remove', module.id, lIdx)} />
                                                                                </div>
                                                                                <LectureBlocksContainer lectureId={item.id} initialBlocks={item.blocks || []} onBlocksChange={(newBlocks) => handlers.updateLectureBlocks(item.id, newBlocks)} isCollapsed={item.collapsed} onToggleCollapse={() => handlers.toggleItem(item.id)} />
                                                                            </div>
                                                                        </SortableModuleWrapper>
                                                                        <EmptyDropZone id={`void-after-org-${item.id}`} />
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            {/* Footer Buttons */}
                                                            <div className="flex gap-3 mt-4 border-t border-gray-100 pt-4">
                                                                <button type="button" className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50" onClick={() => handlers.handleLecture('add', module.id)}>+ Add Lecture</button>
                                                                <button type="button" className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50" onClick={() => handlers.handleSubModule('add', module.id)}>+ Add Sub-Module</button>
                                                            </div>
                                                            {module.content.length === 0 && <EmptyDropZone id={`void-bottom-org-mod-${module.id}`} />}
                                                        </SortableContext>
                                                    </div>
                                                )}
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
                    <DragOverlay adjustScale={false} dropAnimation={null}>
                        {activeId ? (
                            <div className="w-[600px] pointer-events-none shadow-2xl scale-105 opacity-95">
                                <div className="bg-white border-2 border-blue-500 rounded-lg p-4 rotate-1">
                                    <div className="flex items-center gap-3">
                                        <div className="text-gray-400">⠿</div>
                                        <div>
                                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">
                                                {activeId.startsWith('mod-') && "Moving Module"}
                                                {activeId.startsWith('sub-') && "Moving Sub-Module"}
                                                {activeId.startsWith('lec-') && "Moving Lecture"}
                                                {activeId.startsWith('block-') && "Moving Content Block"}
                                            </p>
                                            <h4 className="font-bold text-gray-800">
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
                { /* NAV BUTTONS */}
                <div className="fixed bottom-8 right-24 flex flex-row items-center gap-3 z-[9999]">
                    <button
                        type="button"
                        onClick={() => handlers.viewCourse(courseId || "")}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full shadow-2xl font-bold text-sm hover:bg-gray-800 transition-all">
                        <span>View Course</span>
                    </button>
                    <div className="flex bg-white rounded-full shadow-2xl border border-gray-100 p-1">
                        <div className="relative group flex items-center">
                            <span className="absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-tighter">
                                Expand All
                            </span>
                            <button
                                type="button"
                                onClick={() => handlers.toggleAll(false)}
                                className="p-3 hover:bg-blue-50 rounded-full text-blue-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                                </svg>
                            </button>
                        </div>
                        <div className="w-px h-6 bg-gray-100 self-center mx-1" />
                        <div className="relative group flex items-center">
                            <span className="absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-tighter">
                                Collapse All
                            </span>
                            <button
                                type="button"
                                onClick={() => handlers.toggleAll(true)}
                                className="p-3 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M18 15l-6-6-6 6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </form >
        </div >
    );
};
export default EditCourse;