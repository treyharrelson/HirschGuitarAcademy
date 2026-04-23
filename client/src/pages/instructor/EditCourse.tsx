import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useCourseEditor } from '../../hooks/useCourseEditor';
import { useAppContext } from '../../context/AppContext';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { assets } from '../../assets/assets';
import LectureBlocksContainer from '../../components/instructor/LectureBlockContainer';
import { DndContext, closestCenter, type DragEndEvent, pointerWithin, closestCorners, type DragOverEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { SortableModuleWrapper } from '../../components/instructor/SortableModuleWrapper';
import type { Module, Lecture } from '../../types/course';
import MediaBlockEditor from '../../components/instructor/MediaBlockEditor';

const EditCourse: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { state, setters, handlers, refs } = useCourseEditor();
    const { allCourses } = useAppContext();

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;
        if (!over || active.id === over.id) return;
        setters.setModules((prev: Module[]) => {
            const newModules: Module[] = JSON.parse(JSON.stringify(prev));
            const activeId = String(active.id);
            const overId = String(over.id);
            let draggedItem: any = null;
            const findAndRemove = (list: any[]): boolean => {
                for (let i = 0; i < list.length; i++) {
                    if (String(list[i].id) === activeId) {
                        draggedItem = list.splice(i, 1)[0];
                        return true;
                    }
                    if (list[i].content && Array.isArray(list[i].content)) {
                        if (findAndRemove(list[i].content)) return true;
                    }
                }
                return false;
            };
            const findAndInsert = (list: any[]): boolean => {
                const overIndex = list.findIndex(item => String(item.id) === overId);
                if (overIndex !== -1 && draggedItem) {
                    const isMovingDown = delta.y > 0;
                    const finalIndex = isMovingDown ? overIndex + 1 : overIndex;
                    list.splice(finalIndex, 0, draggedItem);
                    return true;
                }
                if (overId.includes('void-')) {
                    const targetParentId = overId.replace('void-', '').replace('top-', '');
                    if (targetParentId === 'root' && list === newModules) {
                        overId.startsWith('top-') ? list.unshift(draggedItem) : list.push(draggedItem);
                        return true;
                    }
                }
                for (let item of list) {
                    if (String(item.id) === overId && item.content) {
                        item.content.push(draggedItem);
                        return true;
                    }
                    if (overId.includes(String(item.id)) && overId.includes('void-')) {
                        if (!Array.isArray(item.content)) item.content = [];
                        overId.startsWith('top-') ? item.content.unshift(draggedItem) : item.content.push(draggedItem);
                        return true;
                    }
                    if (item.content && Array.isArray(item.content)) {
                        if (findAndInsert(item.content)) return true;
                    }
                }
                return false;
            };
            if (findAndRemove(newModules)) {
                const isDraggingModule = prev.some(m => String(m.id) === activeId);
                const isOverRoot = overId.includes('root') || newModules.some(m => String(m.id) === overId);
                if (!isDraggingModule && isOverRoot) {
                    console.warn("Lectures must stay inside modules.");
                    return prev;
                }
                if (findAndInsert(newModules)) return newModules;
            }
            return prev;
        });
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
    };

    const EmptyDropZone = ({ id }: { id: string }) => {
        const { setNodeRef, isOver } = useSortable({ id });
        return (
            <div
                ref={setNodeRef}
                // h-2 is the 'invisible' resting height
                // h-10 is the 'active' height when dragging over it
                className={`w-full transition-all duration-200 ease-in-out ${isOver
                    ? 'h-10 bg-blue-50 border-2 border-dashed border-blue-300 my-2 rounded-lg'
                    : 'h-2 bg-transparent'
                    }`}>
                {isOver && (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                            Drop here to move
                        </span>
                    </div>
                )}
            </div>
        );
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
                                            }}/>
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
                    collisionDetection={closestCorners}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}>
                    <div className='flex flex-col gap-4'>
                        <p className='font-bold text-lg text-black'>Course Content</p>
                        <SortableContext
                            id="root-modules" // Give it a fixed unique ID
                            items={[...state.modules.map(m => m.id), 'void-root', 'top-void-root']}
                            strategy={verticalListSortingStrategy}>
                            <EmptyDropZone id="top-void-root" />
                            {state.modules?.map((module, mIdx) => (
                                <SortableModuleWrapper key={`mod-${module.id}`} id={`mod-${module.id}`}>
                                    <div key={module.id} className='bg-white border border-gray-300 rounded-lg p-4'>
                                        {/* Module Title Input */}
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b rounded-t-lg">
                                            <span className="font-bold text-black whitespace-nowrap">{mIdx + 1}.</span>
                                            <input
                                                className="font-bold text-black border-b border-transparent hover:border-gray-300 focus:border-blue-500 w-full outline-none bg-transparent"
                                                value={module.title}
                                                onChange={(e) => handlers.updateTitle('module', module.id, e.target.value)}/>
                                            <img
                                                src={assets.cross_icon}
                                                className="w-4 h-4 cursor-pointer opacity-50 hover:opacity-100"
                                                onClick={() => handlers.handleModule('remove', module.id)}/>
                                        </div>
                                        {/* Lectures/SubModules inside Module */}
                                        {(<div className="flex flex-col gap-6 ml-6">
                                            <SortableContext
                                                id={`module-ctx-${module.id}`} // Unique ID based on the parent Module
                                                items={[
                                                    ...(Array.isArray(module.content) ? module.content.map((i: any) => i.id) : []),
                                                    `void-${module.id}`,
                                                    `top-void-${module.id}`
                                                ]}
                                                strategy={verticalListSortingStrategy}>
                                                {module.content?.map((item: any, lIdx: number) => {
                                                    // 1. CHECK IF SUBMODULE: Submodules have a 'content' array
                                                    const isSubModule = Array.isArray(item.content);
                                                    if (isSubModule) {
                                                        return (
                                                            <SortableModuleWrapper key={item.id} id={item.id}>
                                                                <div key={item.id || lIdx} className="ml-6 p-4 border-l-4 border-blue-400 bg-blue-50/20 rounded-r-lg mb-4">
                                                                    <div className="flex items-center justify-between p-3 bg-blue-50/50 gap-3">
                                                                        <div className="flex items-center gap-3 flex-grow">
                                                                            <img
                                                                                onClick={() => handlers.handleSubModule('toggle', module.id, lIdx)}
                                                                                src={assets.dropDown_icon}
                                                                                className={`w-3.5 h-3.5 cursor-pointer transition-transform shrink-0 ${item.collapsed ? "-rotate-90" : "rotate-0"}`}/>
                                                                            <div className="flex flex-col flex-grow">
                                                                                <p className="text-[10px] text-blue-500 uppercase font-black">Sub-Module Title</p>
                                                                                <input
                                                                                    className="font-bold text-gray-800 bg-transparent border-b border-blue-200 outline-none focus:border-blue-500 w-full"
                                                                                    value={item.title}
                                                                                    onChange={(e) => handlers.updateTitle('submodule', item.id, e.target.value, { moduleId: module.id, subModuleIndex: lIdx })}/>
                                                                            </div>
                                                                        </div>
                                                                        <img
                                                                            src={assets.cross_icon}
                                                                            className='cursor-pointer w-4 h-4 opacity-50 hover:opacity-100 shrink-0'
                                                                            onClick={() => handlers.handleSubModule('remove', module.id, lIdx)}/>
                                                                    </div>
                                                                    {/* 2. NESTED LECTURES: Map the content within the SubModule */}
                                                                    {!item.collapsed && (<div className="flex flex-col gap-4 ml-4">
                                                                        <SortableContext
                                                                            id={`submodule-ctx-${item.id}`} // Unique ID based on the parent Sub-Module
                                                                            items={[
                                                                                ...(Array.isArray(item.content) ? item.content.map((sl: any) => sl.id) : []),
                                                                                `void-${item.id}`,
                                                                                `top-void-${item.id}`
                                                                            ]}
                                                                            strategy={verticalListSortingStrategy}>
                                                                            {item.content.map((subLecture: any, slIdx: number) => (
                                                                                <SortableModuleWrapper key={item.content ? `sub-${item.id}` : `lec-${item.id}`} id={item.content ? `sub-${item.id}` : `lec-${item.id}`}>
                                                                                    <div key={subLecture.id || slIdx} className="p-3 bg-white border rounded shadow-sm">
                                                                                        <div className="flex justify-between items-start">
                                                                                            <div className="flex-1">
                                                                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Lecture Title</p>
                                                                                                <input
                                                                                                    className="font-medium text-blue-600 w-full mb-2 outline-none bg-transparent"
                                                                                                    value={subLecture.title}
                                                                                                    onChange={(e) => handlers.updateTitle('lecture', subLecture.id, e.target.value, { moduleId: module.id, subModuleIndex: lIdx })}/>
                                                                                            </div>
                                                                                            <img
                                                                                                src={assets.cross_icon}
                                                                                                className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 p-1"
                                                                                                onClick={() => handlers.handleLecture('remove', module.id, lIdx, slIdx)}/>
                                                                                        </div>
                                                                                        <LectureBlocksContainer
                                                                                            initialBlocks={item.blocks || []}
                                                                                            onBlocksChange={(newBlocks) => handlers.updateLectureBlocks(module.id, item.id, newBlocks)}/>
                                                                                    </div>
                                                                                </SortableModuleWrapper>
                                                                            ))}
                                                                            <div>
                                                                                <button
                                                                                    type="button"
                                                                                    className="text-blue-500 text-sm font-semibold mt-2"
                                                                                    onClick={() => { setters.setPopupType('Lecture'); handlers.handleLecture('add', module.id, lIdx) }}>
                                                                                    + Add Sub-Lecture
                                                                                </button>
                                                                            </div>
                                                                            <EmptyDropZone id={`void-${item.id}`} />
                                                                        </SortableContext>
                                                                    </div>
                                                                    )}
                                                                </div>
                                                            </SortableModuleWrapper>
                                                        );
                                                    }
                                                    // 3. DEFAULT LECTURE: If it's not a submodule, render standard lecture
                                                    return (
                                                        <SortableModuleWrapper key={item.content ? `sub-${item.id}` : `lec-${item.id}`} id={item.content ? `sub-${item.id}` : `lec-${item.id}`}>
                                                            <div key={item.id} className="p-4 bg-gray-50 rounded border mb-4">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex flex-col mb-2">
                                                                        <p className="text-xs text-gray-400 uppercase font-bold">Lecture Title</p>
                                                                        <input
                                                                            className="font-medium text-blue-600 bg-transparent border-b border-transparent focus:border-blue-300 outline-none"
                                                                            value={item.title}
                                                                            onChange={(e) => handlers.updateTitle('lecture', item.id, e.target.value, { moduleId: module.id })}/>
                                                                    </div>
                                                                    <img
                                                                        src={assets.cross_icon}
                                                                        className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 p-1"
                                                                        onClick={() => handlers.handleLecture('remove', module.id, lIdx)}/>
                                                                </div>
                                                                <LectureBlocksContainer
                                                                    initialBlocks={item.blocks || []}
                                                                    onBlocksChange={(newBlocks) => handlers.updateLectureBlocks(module.id, item.id, newBlocks)}/>
                                                            </div>
                                                        </SortableModuleWrapper>
                                                    );
                                                })}
                                                <div className="flex gap-4 mt-4 border-t pt-4">
                                                    <button
                                                        type="button"
                                                        className="bg-gray-100 px-3 py-1 rounded text-sm"
                                                        onClick={() => { setters.setPopupType('Lecture'); handlers.handleLecture('add', module.id) }}>
                                                        + Add Lecture
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bg-gray-100 px-3 py-1 rounded text-sm"
                                                        onClick={() => { setters.setPopupType('SubModule'); handlers.handleSubModule('add', module.id) }}>
                                                        + Add Sub-Module
                                                    </button>
                                                </div>
                                                <EmptyDropZone id={`void-${module.id}`} />
                                            </SortableContext>
                                        </div>
                                        )}
                                    </div>
                                </SortableModuleWrapper>
                            ))}
                            <EmptyDropZone id="void-root" />
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
                                                }}/>
                                        </div>
                                        <button onClick={() => handlers.handleLecture('save')} type='button' className='w-full bg-blue-400 text-white px-4 py-2 rounded cursor-pointer'>Add</button>
                                        <img onClick={() => setters.setPopup(false)} src={assets.cross_icon} alt='cross icon' className='absolute top-4 right-4 w-4 h-4 cursor-pointer' />
                                    </div>
                                </div>
                            )}
                        </SortableContext>
                    </div>
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
            </form>
        </div>
    );
};
export default EditCourse;