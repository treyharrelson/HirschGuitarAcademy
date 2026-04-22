import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useCourseEditor } from '../../hooks/useCourseEditor';
import { useAppContext } from '../../context/AppContext';
import LectureEditor from '../../components/instructor/LectureBlockContainer';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { assets } from '../../assets/assets';
import LectureBlocksContainer from '../../components/instructor/LectureBlockContainer';
import AddBlockMenu from '../../components/instructor/AddBlockMenu';


const EditCourse: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { state, setters, handlers, refs } = useCourseEditor();
    const { allCourses } = useAppContext();

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

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
        // Only init if loading is done, the div exists, and Quill isn't already there
        if (!loading && refs.editorRef.current && !refs.quillRef.current) {

            const quill = new Quill(refs.editorRef.current, {
                theme: 'snow',
                modules: { toolbar: true }
            });

            refs.quillRef.current = quill;

            // Fill the editor with the description stored in state
            if (state.courseDescription) {
                quill.root.innerHTML = state.courseDescription;
            }

            // Listen for changes to keep the state updated
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

    const handleUpdate = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSubmitting(true);
        setStatusMsg('');
        const descriptionHtml = refs.quillRef.current ? refs.quillRef.current.root.innerHTML : '';
        const payload = {
            name: state.courseTitle,
            isPrivate: state.isPrivate,
            description: descriptionHtml,
            modules: state.modules,
            requirements: state.courseRequirements,
        };
        try {
            // Log the payload to verify data before it's sent
            console.log("Sending payload:", payload);
            const response = await api.put(`/api/courses/${courseId}`, payload, {
                withCredentials: true
            });
            if (response.status === 200 || response.status === 204) {
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
                {/* COURSE REQUIREMENTS */}
                <div className='flex flex-col gap-1'>
                    <p className='font-medium'>Course Prerequisites</p>
                    <div className='border border-gray-300 rounded p-4 max-h-40 overflow-y-auto bg-white'>
                        {allCourses.length === 0 ? <p className='text-sm text-gray-400'>No courses available</p> : allCourses.filter(c => String(c.id) !== courseId).map(course => (
                            <label key={course.id} className='flex items-center gap-2 mb-1 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={state.courseRequirements.includes(String(course.id))}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setters.setCourseRequirements([...state.courseRequirements, String(course.id)]);
                                        } else {
                                            setters.setCourseRequirements(state.courseRequirements.filter(id => id !== String(course.id)));
                                        }
                                    }}
                                />
                                {course.name}
                            </label>
                        ))}
                    </div>
                </div>
                {/* MODULES & LECTURES */}
                <div className='flex flex-col gap-4'>
                    <p className='font-bold text-lg text-black'>Course Content</p>
                    {state.modules.map((module, mIdx) => (
                        <div key={module.id} className='bg-white border border-gray-300 rounded-lg p-4'>
                            {/* Module Title Input */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 border-b rounded-t-lg">
                                {/*<img
                                    onClick={() => handlers.handleModule('toggle', module.id)}
                                    src={assets.dropDown_icon}
                                    className={`w-4 h-4 cursor-pointer transition-transform ${module.collapsed ? "-rotate-90" : ""}`}
                                />*/}
                                <span className="font-bold text-black whitespace-nowrap">{mIdx + 1}.</span>
                                <input
                                    className="font-bold text-black border-b border-transparent hover:border-gray-300 focus:border-blue-500 w-full outline-none bg-transparent"
                                    value={module.title}
                                    onChange={(e) => handlers.updateTitle('module', module.id, e.target.value)}
                                />
                                <img
                                    src={assets.cross_icon}
                                    className="w-4 h-4 cursor-pointer opacity-50 hover:opacity-100"
                                    onClick={() => handlers.handleModule('remove', module.id)}
                                />
                            </div>
                            {/* Lectures inside Module */}
                            {(<div className="flex flex-col gap-6 ml-6">
                                {module.content.map((item: any, lIdx: number) => {
                                    // 1. CHECK IF SUBMODULE: Submodules have a 'content' array
                                    const isSubModule = Array.isArray(item.content);
                                    if (isSubModule) {
                                        return (
                                            <div key={item.id || lIdx} className="ml-6 p-4 border-l-4 border-blue-400 bg-blue-50/20 rounded-r-lg mb-4">
                                                <div className="flex items-center justify-between p-3 bg-blue-50/50 gap-3">
                                                    <div className="flex items-center gap-3 flex-grow">
                                                        <img
                                                            onClick={() => handlers.handleSubModule('toggle', module.id, lIdx)}
                                                            src={assets.dropDown_icon}
                                                            className={`w-3.5 h-3.5 cursor-pointer transition-transform shrink-0 ${item.collapsed ? "-rotate-90" : "rotate-0"}`}
                                                        />
                                                        <div className="flex flex-col flex-grow">
                                                            <p className="text-[10px] text-blue-500 uppercase font-black">Sub-Module Title</p>
                                                            <input
                                                                className="font-bold text-gray-800 bg-transparent border-b border-blue-200 outline-none focus:border-blue-500 w-full"
                                                                value={item.title}
                                                                onChange={(e) => handlers.updateTitle('submodule', item.id, e.target.value, { moduleId: module.id, subModuleIndex: lIdx })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <img
                                                        src={assets.cross_icon}
                                                        className='cursor-pointer w-4 h-4 opacity-50 hover:opacity-100 shrink-0'
                                                        onClick={() => handlers.handleSubModule('remove', module.id, lIdx)}
                                                    />

                                                </div>
                                                {/* 2. NESTED LECTURES: Map the content within the SubModule */}
                                                {!item.collapsed && (<div className="flex flex-col gap-4 ml-4">
                                                    {item.content.map((subLecture: any, slIdx: number) => (
                                                        <div key={subLecture.id || slIdx} className="p-3 bg-white border rounded shadow-sm">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Lecture Title</p>
                                                                    <input
                                                                        className="font-medium text-blue-600 w-full mb-2 outline-none bg-transparent"
                                                                        value={subLecture.title}
                                                                        onChange={(e) => handlers.updateTitle('lecture', subLecture.id, e.target.value, { moduleId: module.id, subModuleIndex: lIdx })}
                                                                    />
                                                                </div>
                                                                <img
                                                                    src={assets.cross_icon}
                                                                    className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 p-1"
                                                                    onClick={() => handlers.handleLecture('remove', module.id, lIdx, slIdx)}
                                                                />
                                                            </div>
                                                            <LectureBlocksContainer
                                                                initialBlocks={item.blocks || []}
                                                                onBlocksChange={(newBlocks) => handlers.updateLectureBlocks(item.id, newBlocks)}
                                                            />
                                                        </div>
                                                    ))}
                                                    <div>
                                                        <button
                                                            type="button"
                                                            className="text-blue-500 text-sm font-semibold mt-2"
                                                            onClick={() => { setters.setPopupType('Lecture'); handlers.handleLecture('add', module.id, lIdx) }}
                                                        >
                                                            + Add Sub-Lecture
                                                        </button>
                                                    </div>
                                                </div>)}
                                            </div>
                                        );
                                    }
                                    // 3. DEFAULT LECTURE: If it's not a submodule, render standard lecture
                                    return (
                                        <div key={item.id || lIdx} className="p-4 bg-gray-50 rounded border mb-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col mb-2">
                                                    <p className="text-xs text-gray-400 uppercase font-bold">Lecture Title</p>
                                                    <input
                                                        className="font-medium text-blue-600 bg-transparent border-b border-transparent focus:border-blue-300 outline-none"
                                                        value={item.title}
                                                        onChange={(e) => handlers.updateTitle('lecture', item.id, e.target.value, { moduleId: module.id })}
                                                    />
                                                </div>
                                                <img
                                                    src={assets.cross_icon}
                                                    className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 p-1"
                                                    onClick={() => handlers.handleLecture('remove', module.id, lIdx)}
                                                />
                                            </div>
                                            <LectureBlocksContainer
                                                initialBlocks={item.blocks || []}
                                                onBlocksChange={(newBlocks) => handlers.updateLectureBlocks(item.id, newBlocks)}
                                            />

                                        </div>
                                    );
                                })}
                                <div className="flex gap-4 mt-4 border-t pt-4">
                                    <button
                                        type="button"
                                        className="bg-gray-100 px-3 py-1 rounded text-sm"
                                        onClick={() => { setters.setPopupType('Lecture'); handlers.handleLecture('add', module.id) }}
                                    >
                                        + Add Lecture
                                    </button>
                                    <button
                                        type="button"
                                        className="bg-gray-100 px-3 py-1 rounded text-sm"
                                        onClick={() => { setters.setPopupType('SubModule'); handlers.handleSubModule('add', module.id) }}
                                    >
                                        + Add Sub-Module
                                    </button>
                                </div>
                            </div>)}
                        </div>
                    ))}
                    <button
                        type="button"
                        className="w-full py-4 bg-blue-100 text-blue-600 font-bold rounded-lg border-2 border-dashed border-blue-300"
                        onClick={() => { setters.setPopupType('Module'); handlers.handleModule('add') }}
                    >
                        + Add New Module
                    </button>
                    {/* CONTENT TITLE POPUP */}
                    {state.showPopup && (
                        <div className='fixed inset-0 flex items-center justify-center bg-gray-800/50 '>
                            <div className='bg-white text-gray-700 p-4 rounded relative w-full max-w-80'>
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
                                        }}
                                    />
                                </div>
                                <button onClick={() => handlers.handleLecture('save')} type='button' className='w-full bg-blue-400 text-white px-4 py-2 rounded cursor-pointer'>Add</button>
                                <img onClick={() => setters.setPopup(false)} src={assets.cross_icon} alt='cross icon' className='absolute top-4 right-4 w-4 h-4 cursor-pointer' />
                            </div>
                        </div>
                    )}
                </div>
                {/* SUBMIT */}
                <div className="flex items-center gap-4">
                    <button
                        type='submit'
                        disabled={submitting}
                        className='bg-blue-600 text-white py-3 px-10 rounded font-bold hover:bg-blue-700 disabled:opacity-50'
                    >
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