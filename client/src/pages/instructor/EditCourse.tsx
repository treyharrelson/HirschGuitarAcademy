import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useCourseEditor } from '../../hooks/useCourseEditor';
import LectureEditor from '../../components/instructor/LectureEditor';
import Quill from 'quill';
import "quill/dist/quill.snow.css";

const EditCourse: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { state, setters, handlers, refs } = useCourseEditor();

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

                if (!refs.quillRef.current && refs.editorRef.current) {
                    refs.quillRef.current = new Quill(refs.editorRef.current, { theme: 'snow' });
                }

                if (refs.quillRef.current && course.description) {
                    refs.quillRef.current.root.innerHTML = course.description;
                }
            } catch (err) {
                setStatusMsg("Error loading course data.");
            } finally {
                setLoading(false);
            }
        };

        if (courseId) fetchAndPopulate();
    }, [courseId]);

    const handleUpdate = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSubmitting(true);
        setStatusMsg('');

        // Ensure we capture the Quill content at the EXACT moment of submission
        const descriptionHtml = refs.quillRef.current ? refs.quillRef.current.root.innerHTML : '';

        const payload = {
            name: state.courseTitle,
            isPrivate: state.isPrivate,
            description: descriptionHtml,
            modules: state.modules, // Double-check this isn't empty in your console
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
                    <div ref={refs.editorRef} className="bg-white"></div>
                </div>

                {/* MODULES & LECTURES */}
                <div className='flex flex-col gap-4'>
                    <p className='font-bold text-lg text-black'>Course Content</p>
                    {state.modules.map((module, mIdx) => (
                        <div key={module.id} className='bg-white border border-gray-300 rounded-lg p-4'>
                            {/* Module Title Input */}
                            <div className="flex gap-2 items-center mb-4">
                                <span className="font-bold">{mIdx + 1}.</span>
                                <input
                                    className="font-bold text-black border-b w-full outline-none focus:border-blue-500"
                                    value={module.title}
                                    onChange={(e) => handlers.updateTitle('module', module.id, e.target.value)}
                                />
                            </div>

                            {/* Lectures inside Module */}
                            <div className="flex flex-col gap-6 ml-6">
                                {module.content.map((item: any, lIdx: number) => (
                                    <div key={item.id} className="p-4 bg-gray-50 rounded border">
                                        <div className="flex flex-col mb-2">
                                            <p className="text-xs text-gray-400 uppercase font-bold">Lecture Title</p>
                                            <input
                                                className="font-medium text-blue-600 bg-transparent border-b border-transparent focus:border-blue-300 outline-none"
                                                value={item.title}
                                                onChange={(e) => handlers.updateTitle('lecture', item.id, e.target.value, { moduleId: module.id })}
                                            />
                                        </div>
                                        {/* Content Editor */}
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Lecture Content</p>
                                        <LectureEditor
                                            initialContent={item.content}
                                            onContentChange={(val) => handlers.updateLectureContent(module.id, lIdx, val)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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