import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Course, Module, Lecture } from '../../types/course';
import api from '../../api/axiosInstance';
import Loading from '../../components/student/Loading';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import LectureContentRenderer from '../../components/student/LectureContentRenderer';
import "quill/dist/quill.snow.css";

interface ExtendedCourse extends Course {
    modules: Module[];
    description: string;
}

const CourseView: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [course, setCourse] = useState<ExtendedCourse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const isInstructor = user?.role === 'instructor' || course?.instructorId === user?.id;

    const flattenedLectures = useMemo(() => {
        if (!course?.modules) return [];
        const flattened: Lecture[] = [];
        const traverse = (items: any[]) => {
            items.forEach(item => {
                if (item.blocks) flattened.push(item);
                if (item.content) traverse(item.content);
            });
        };
        traverse(course.modules);
        return flattened;
    }, [course]);

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const response = await api.get(`/api/courses/${courseId}`);
                setCourse(response.data);

                const initialExpanded: Record<string, boolean> = {};
                response.data.modules.forEach((mod: Module) => { initialExpanded[mod.id] = true; });
                setExpandedModules(initialExpanded);

                if (user?.role === 'student') {
                    const progressRes = await api.get(`/api/courses/${courseId}/progress`);
                    setCompletedIds(progressRes.data.completedLectures || []);
                }
                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };
        if (courseId) fetchCourseData();
    }, [courseId, user]);

    const currentIndex = flattenedLectures.findIndex(l => l.id === selectedLecture?.id);
    const isCurrentComplete = selectedLecture ? completedIds.map(String).includes(String(selectedLecture.id)) : false;

    const handleMarkComplete = async () => {
        if (!selectedLecture || isInstructor) return;
        try {
            await api.post(`/api/courses/${courseId}/lectures/${selectedLecture.id}/complete`);
            setCompletedIds(prev => [...prev, selectedLecture.id]);
        } catch (e) {
            console.error(e);
        }
    };

    const handleNext = () => {
        if (!selectedLecture) {
            if (flattenedLectures.length > 0) setSelectedLecture(flattenedLectures[0]);
            return;
        }

        if (currentIndex < flattenedLectures.length - 1) {
            setSelectedLecture(flattenedLectures[currentIndex + 1]);
        } else {
            if (isInstructor) {
                navigate('/instructor/my-courses');
            } else {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#0ea5e9', '#22c55e', '#ffffff']
                });
                setTimeout(() => {
                    navigate(`/my-enrollments`);
                }, 2000);
            }
        }
    };

    const renderSidebarItem = (item: any, depth: number = 0) => {
        const isModule = Array.isArray(item.content);
        if (isModule) {
            const isExpanded = expandedModules[item.id];
            return (
                <div key={item.id}>
                    <div
                        className={`flex justify-between items-center py-2 px-4 cursor-pointer hover:bg-slate-100 ${depth > 0 ? 'pl-8 text-sm' : 'font-bold'}`}
                        onClick={() => setExpandedModules(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    >
                        <span>{item.title}</span>
                        <span className={`text-[10px] transition-transform ${isExpanded ? '' : '-rotate-90'}`}>▼</span>
                    </div>
                    {isExpanded && item.content.map((child: any) => renderSidebarItem(child, depth + 1))}
                </div>
            );
        }

        const itemIndex = flattenedLectures.findIndex(l => String(l.id) === String(item.id));
        const prevLecture = itemIndex > 0 ? flattenedLectures[itemIndex - 1] : null;

        const isLocked = !isInstructor &&
            itemIndex > 0 &&
            !completedIds.includes(String(prevLecture?.id || ''));

        const isActive = selectedLecture?.id === item.id;

        return (
            <button
                key={item.id}
                disabled={isLocked}
                onClick={() => setSelectedLecture(item)}
                className={`w-full text-left py-2 px-4 pl-12 text-sm transition-all ${isActive
                    ? 'bg-sky-100 text-sky-700 border-r-4 border-sky-700 font-semibold'
                    : isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-slate-50'
                    }`}
            >
                {completedIds.includes(String(item.id)) ? '✅' : '📄'} {item.title}
            </button>
        );
    };

    if (loading || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white">
                <Loading />
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading course...</p>
            </div>
        );
    }

    if (flattenedLectures.length === 0 && course.modules.length > 0) return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white">
            <Loading />
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading course...</p>
        </div>
    );;

    const showNextButtonDisabled = !isInstructor && !!selectedLecture && !isCurrentComplete;

    return (
        <div className="flex h-screen bg-white">
            <div className="w-80 border-r flex flex-col bg-slate-50">
                <div className="p-6 bg-slate-900 text-white">
                    <h2 className="font-bold truncate">{course?.name}</h2>
                </div>
                <div className="overflow-y-auto flex-1 py-4">
                    <button
                        onClick={() => setSelectedLecture(null)}
                        className={`w-full text-left py-3 px-6 font-bold text-sm border-b transition-colors ${!selectedLecture ? 'bg-sky-600 text-white' : 'hover:bg-slate-200'}`}
                    >
                        🏠 Course Overview
                    </button>
                    {course?.modules.map(mod => renderSidebarItem(mod))}
                </div>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="flex-1 overflow-y-auto p-12 pb-32">
                    {!selectedLecture ? (
                        <div className="max-w-3xl mx-auto">
                            <h1 className="text-4xl font-bold mb-6">{course?.name}</h1>
                            <div className="ql-editor prose max-w-none text-lg text-slate-700" dangerouslySetInnerHTML={{ __html: course?.description || '' }} />
                            <button
                                onClick={() => handleNext()}
                                className="mt-8 bg-sky-600 text-white px-8 py-3 rounded-full font-bold hover:bg-sky-700 transition-all shadow-lg"
                            >
                                Start Learning →
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-3xl font-bold border-b pb-4 mb-8">{selectedLecture.title}</h1>
                            <LectureContentRenderer blocks={selectedLecture.blocks || []} />
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-white border-t flex items-center justify-between px-12 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex gap-4">
                        {currentIndex > 0 && (
                            <button onClick={() => setSelectedLecture(flattenedLectures[currentIndex - 1])} className="px-6 py-2 border border-slate-300 rounded-full font-bold hover:bg-slate-50 transition-colors">
                                ← Previous
                            </button>
                        )}
                        {!selectedLecture && currentIndex === -1 && flattenedLectures.length > 0 && isInstructor && (
                            <button onClick={() => navigate(`/instructor/edit-course/${courseId}`)} className="px-6 py-2 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700">
                                Edit Course
                            </button>
                        )}
                        {selectedLecture && isInstructor && (
                            <button onClick={() => navigate(`/instructor/edit-course/${courseId}`)} className="px-6 py-2 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700">
                                Edit Course
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {!isInstructor && selectedLecture && !isCurrentComplete && (
                            <button onClick={handleMarkComplete} className="px-8 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-md">
                                Mark as Complete
                            </button>
                        )}
                        <button
                            disabled={showNextButtonDisabled}
                            onClick={handleNext}
                            className={`px-8 py-2 rounded-full font-bold transition-all ${(!isInstructor && selectedLecture && !isCurrentComplete) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-sky-600 text-white shadow-lg hover:bg-sky-700'}`}
                        >
                            {!selectedLecture ? 'Start Course' : (currentIndex === flattenedLectures.length - 1 ? 'Finish Course' : 'Next Lecture →')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseView;