import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Course, Module, Lecture } from '../../types/course';
import api from '../../api/axiosInstance';
import Loading from '../../components/student/Loading';
import { useAuth } from '../../context/AuthContext';
import "quill/dist/quill.snow.css";



interface ExtendedCourse extends Course {
    modules: Module[];
}

const CourseView: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<ExtendedCourse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [completing, setCompleting] = useState<boolean>(false);

    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const { user } = useAuth();
    const canEdit = user?.role === 'instructor' || course?.instructor;

    useEffect(() => {
        const fetchCourseContent = async () => {
            try {
                const response = await api.get(`/api/courses/${courseId}`);
                if (response.status !== 200) {
                    throw new Error('Failed to fetch course content');
                }
                const data = response.data;
                setCourse(data);

                const initialExpandedState: Record<string, boolean> = {};
                if (data.modules && data.modules.length > 0) {
                    data.modules.forEach((mod: Module) => {
                        initialExpandedState[mod.id] = true;
                    });
                    setExpandedModules(initialExpandedState);

                    const firstModule = data.modules[0];
                    if (firstModule.content && firstModule.content.length > 0) {
                        setSelectedLecture(firstModule.content[0] as Lecture);
                    }
                }

                if (user?.role === 'student') {
                    try {
                        const enrollmentsRes = await api.get('/api/courses/my-enrollments');
                        const courseEnrollment = enrollmentsRes.data.find((c: any) => c.id.toString() === courseId);
                        if (courseEnrollment) {
                            setIsEnrolled(true);
                            setIsCompleted(!!courseEnrollment.completed);
                        }
                    } catch (e) {
                        console.error('Failed to fetch enrollments', e);
                    }
                }

                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourseContent();
        }
    }, [courseId]);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const handleSelectLecture = (lecture: Lecture) => {
        setSelectedLecture(lecture);
    };

    const handleCompleteCourse = async () => {
        if (!courseId) return;
        setCompleting(true);
        try {
            await api.post(`/api/courses/${courseId}/complete`);
            setIsCompleted(true);
        } catch (e) {
            console.error('Failed to complete course', e);
            alert('Failed to complete course, try again later.');
        } finally {
            setCompleting(false);
        }
    };

    const getModuleHeaderClasses = (depth: number) => {
        let classes = "flex justify-between items-center py-3 pr-6 cursor-pointer transition-all duration-200 border-l-4 border-l-transparent hover:bg-slate-200 hover:border-l-slate-400 ";
        if (depth === 0) classes += "bg-slate-100 font-semibold text-slate-700 pl-6";
        else if (depth === 1) classes += "bg-slate-50 font-medium text-slate-600 pl-9 text-sm";
        else if (depth === 2) classes += "bg-white font-medium text-slate-500 pl-12";
        else classes += "bg-white font-medium text-slate-500 pl-[60px]";
        return classes;
    }

    const getLectureItemClasses = (depth: number, isActive: boolean) => {
        let classes = "flex items-center py-2.5 pr-6 cursor-pointer text-sm transition-all duration-200 ";
        if (depth === 0) classes += "pl-9 ";
        else if (depth === 1) classes += "pl-12 ";
        else if (depth === 2) classes += "pl-[60px] ";
        else classes += "pl-[72px] ";

        if (isActive) {
            classes += "bg-sky-100 text-sky-700 font-medium border-r-[3px] border-r-sky-700 ";
        } else {
            classes += "text-slate-600 hover:bg-slate-50 hover:text-slate-900 ";
        }
        return classes;
    }

    const renderModuleContent = (item: any, depth: number = 0) => {
        // Check if it's a Module (Top-level or Sub-Module)
        const isModule = Array.isArray(item.content);

        if (isModule) {
            const mod = item as Module;
            const isExpanded = expandedModules[mod.id];

            return (
                <div key={`mod-container-${mod.id}`} className={depth === 0 ? "mb-2" : "mb-1"}>
                    <div
                        className={`${getModuleHeaderClasses(depth)} transition-colors cursor-pointer`}
                        onClick={() => toggleModule(mod.id)}
                    >
                        {/* Add visual nesting indicator for submodules */}
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className={`text-[0.95rem] font-medium truncate ${depth > 0 ? 'text-slate-600' : 'text-slate-800'}`}>
                                {mod.title}
                            </span>
                        </div>
                        <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}>
                            ▼
                        </span>
                    </div>

                    {isExpanded && (
                        <div className={`border-l-2 border-slate-100 ml-4`}>
                            {mod.content.map((subItem) => renderModuleContent(subItem, depth + 1))}
                        </div>
                    )}
                </div>
            );
        } else {
            // It's a Lecture
            const lec = item as Lecture;
            const isActive = selectedLecture?.id === lec.id;

            return (
                <div
                    key={`lec-item-${lec.id}`}
                    className={getLectureItemClasses(depth, isActive)}
                    onClick={() => handleSelectLecture(lec)}
                >
                    <span className={`mr-3 text-base ${isActive ? 'text-sky-500' : 'opacity-50'}`}>
                        {isActive ? '📖' : '📄'}
                    </span>
                    <span className="truncate">{lec.title}</span>
                </div>
            );
        }
    };


    if (loading) return <Loading />
    if (error) return <div className="flex justify-center flex-col items-center h-screen text-xl text-red-500">Error: {error}</div>;
    if (!course) return <div className="flex justify-center flex-col items-center h-screen text-xl text-red-500">Course not found</div>;

    return (
        <div className="flex flex-col md:flex-row w-full bg-slate-50 overflow-hidden font-sans" style={{ height: 'calc(100vh - 64px)' }}>

            {/* LEFT SIDEBAR */}
            <div className="w-full md:w-[350px] shrink-0 bg-white md:border-r border-b md:border-b-0 border-slate-200 flex flex-col overflow-y-auto shadow-[2px_0_10px_rgba(0,0,0,0.02)] h-[35vh] md:h-auto">
                <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white flex justify-between items-center">
                    <h2 className="m-0 text-xl font-semibold leading-relaxed pr-15">{course?.name}</h2>
                    <div className="flex gap-2">
                        {canEdit && (
                            <button onClick={() => window.location.href = `/instructor/edit-course/${courseId}`} className="w-30 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors">
                                EDIT
                            </button>
                        )}
                    </div>
                </div>

                <div className="py-4">
                    {/* Sidebar Logic */}
                    {course?.modules ? (
                        course.modules.map((mod: any) => renderModuleContent(mod, 0))
                    ) : (
                        <div className="p-6 text-slate-400 italic text-sm">Loading content...</div>
                    )}
                </div>
            </div>

            {/* RIGHT CONTENT AREA (Your New Logic) */}
            <div className="grow py-10 px-5 md:px-16 overflow-y-auto bg-white h-[65vh] md:h-auto">
                {selectedLecture ? (
                    <div className="max-w-[900px] mx-auto">
                        <h1 className="text-4xl font-bold text-slate-900 mt-0 mb-6 pb-4 border-b border-slate-200">
                            {selectedLecture.title}
                        </h1>

                        <div className="flex flex-col gap-10">
                            {selectedLecture.blocks && selectedLecture.blocks.length > 0 ? (
                                selectedLecture.blocks.map((block: any, index: number) => (
                                    <div key={index} className="w-full">
                                        {block.type === 'text' && (
                                            <div
                                                className="ql-editor text-lg leading-relaxed text-slate-700"
                                                dangerouslySetInnerHTML={{ __html: block.content || '' }}
                                            />
                                        )}
                                        {block.type === 'image' && (
                                            <div className="flex justify-center">
                                                <img src={block.url} alt="" className="rounded-xl shadow-md max-h-[600px] object-contain" />
                                            </div>
                                        )}
                                        {block.type === 'video' && (
                                            <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                                                {block.url?.includes('youtube.com') || block.url?.includes('youtu.be') ? (
                                                    <iframe className="w-full h-full" src={block.url.replace("watch?v=", "embed/")} title="Video player" allowFullScreen />
                                                ) : (
                                                    <video src={block.url} controls className="w-full h-full" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div
                                    className="text-lg leading-relaxed text-slate-700"
                                    dangerouslySetInnerHTML={{ __html: (selectedLecture as any).content || '<p>No content provided.</p>' }}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-full text-slate-400 text-xl">
                        <p>Select a lecture from the sidebar to view its content.</p>
                    </div>
                )}
            </div>
        </div>
    );

};

export default CourseView;
