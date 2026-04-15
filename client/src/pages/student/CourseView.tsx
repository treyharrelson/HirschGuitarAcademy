import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Course, Module, Lecture } from '../../types/course';
import api from '../../api/axiosInstance';
import Loading from '../../components/student/Loading';
import { useAuth } from '../../context/AuthContext';

interface ExtendedCourse extends Course {
    modules: Module[];
}

const CourseView: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<ExtendedCourse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    const renderModuleContent = (item: Module | Lecture, depth: number = 0) => {
        if (Array.isArray(item.content)) {
            const mod = item as Module;
            const isExpanded = expandedModules[mod.id];

            return (
                <div key={`mod-${mod.id}`} className="mb-2">
                    <div
                        className={getModuleHeaderClasses(depth)}
                        onClick={() => toggleModule(mod.id)}
                    >
                        <span className="text-[0.95rem]">{mod.title}</span>
                        <span className={`text-xs text-slate-500 transition-transform duration-200 inline-block ${isExpanded ? '' : '-rotate-90'}`}>
                            ▼
                        </span>
                    </div>
                    {isExpanded && (
                        <div className="py-2 bg-white">
                            {mod.content.map(subItem => renderModuleContent(subItem, depth + 1))}
                        </div>
                    )}
                </div>
            );
        } else {
            const lec = item as Lecture;
            const isActive = selectedLecture?.id === lec.id;

            return (
                <div
                    key={`lec-${lec.id}`}
                    className={getLectureItemClasses(depth, isActive)}
                    onClick={() => handleSelectLecture(lec)}
                >
                    <span className="mr-3 text-base opacity-70">📄</span>
                    <span>{lec.title}</span>
                </div>
            );
        }
    };

    if (loading) return <Loading />
    if (error) return <div className="flex justify-center flex-col items-center h-screen text-xl text-red-500">Error: {error}</div>;
    if (!course) return <div className="flex justify-center flex-col items-center h-screen text-xl text-red-500">Course not found</div>;

    return (
        
        <div className="flex flex-col md:flex-row w-full bg-slate-50 overflow-hidden font-sans" style={{ height: 'calc(100vh - 64px)' }}>
            
            <div className="w-full md:w-[350px] shrink-0 bg-white md:border-r border-b md:border-b-0 border-slate-200 flex flex-col overflow-y-auto shadow-[2px_0_10px_rgba(0,0,0,0.02)] h-[35vh] md:h-auto">
                <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white flex">
                    <h2 className="m-0 text-xl font-semibold leading-relaxed pr-15">{course.name}</h2>
                    {canEdit && (
                    <button
                        onClick={() => window.location.href = `/instructor/edit-course/${courseId}`}
                        className="w-30 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                    >
                        EDIT COURSE
                    </button>
                )}
                </div>
                <div className="py-4">
                    {course.modules && course.modules.map(mod => renderModuleContent(mod))}
                    
                </div>
                
            </div>

            <div className="grow py-10 px-5 md:px-16 overflow-y-auto bg-white h-[65vh] md:h-auto">
                {selectedLecture ? (
                    <div className="max-w-[900px] mx-auto">
                        <h1 className="text-4xl font-bold text-slate-900 mt-0 mb-6 pb-4 border-b border-slate-200">{selectedLecture.title}</h1>
                        <div
                            className="text-lg leading-relaxed text-slate-700 [&>p]:mb-4 [&>img]:!max-w-full [&>img]:!rounded-lg [&>img]:!shadow-sm"
                            dangerouslySetInnerHTML={{ __html: selectedLecture.content || '<p>No content provided.</p>' }}
                        />
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
