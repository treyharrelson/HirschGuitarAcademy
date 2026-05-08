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
    badge?: { id: number; name: string; imageUrl: string; displayUrl?: string };
}

const CourseView: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState<ExtendedCourse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    const [showBadgePopup, setShowBadgePopup] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);


    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

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
                let courseData = response.data;
                if (courseData.badge?.imageUrl) {
                    try {
                        const urlRes = await api.get('/api/upload/file-url', {
                            params: { fileKey: courseData.badge.imageUrl }
                        });
                        courseData.badge.displayUrl = urlRes.data.presignedUrl;
                    } catch (e) {
                        console.error("Could not resolve badge image", e);
                    }
                }
                setCourse(response.data);
                const initialExpanded: Record<string, boolean> = {};
                const expandAll = (items: any[]) => {
                    items.forEach((item) => {
                        if (Array.isArray(item.content)) {
                            initialExpanded[item.id] = true;
                            expandAll(item.content);
                        }
                    });
                };
                expandAll(response.data.modules);
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

    useEffect(() => {
        if (!selectedLecture || !course?.modules) return;
        const newExpanded = { ...expandedModules };
        const expandParents = (items: any[], parentId?: string): boolean => {
            for (const item of items) {
                if (Array.isArray(item.content)) {
                    const containsLecture = expandParents(item.content, item.id);
                    if (containsLecture) {
                        newExpanded[item.id] = true;
                        return true;
                    }
                } else if (item.id === selectedLecture.id) {
                    if (parentId) newExpanded[parentId] = true;
                    return true;
                }
            }
            return false;
        };
        expandParents(course.modules);
        if (JSON.stringify(newExpanded) !== JSON.stringify(expandedModules)) {
            setExpandedModules(newExpanded);
        }
    }, [selectedLecture, course?.modules]);

    const isCourseFullyComplete = useMemo(() => {
        return flattenedLectures.length > 0 && completedIds.length === flattenedLectures.length;
    }, [completedIds, flattenedLectures]);

    const currentIndex = flattenedLectures.findIndex(l => l.id === selectedLecture?.id);
    const isCurrentComplete = selectedLecture ? completedIds.map(String).includes(String(selectedLecture.id)) : false;
    const showNextButtonDisabled = !isInstructor && !!selectedLecture && !isCurrentComplete;

    const handleMarkComplete = async () => {
        if (!selectedLecture || isInstructor) return;
        try {
            await api.post(`/api/courses/${courseId}/lectures/${selectedLecture.id}/complete`);
            setCompletedIds(prev => [...prev, String(selectedLecture.id)]);
        } catch (e) {
            console.error(e);
        }
    };

    const handleNext = () => {
        if (isProcessing) return;
        setIsProcessing(true);

        if (!selectedLecture) {
            if (flattenedLectures.length > 0) setSelectedLecture(flattenedLectures[0]);
            setIsProcessing(false);
            return;
        }

        if (currentIndex < flattenedLectures.length - 1) {
            // Standard navigation
            setSelectedLecture(flattenedLectures[currentIndex + 1]);
            setIsProcessing(false);
        } else {
            // User is on the last lecture and clicked the finish button
            handleFinishCourse();
        }
    };

    const handleFinishCourse = () => {
        // Check if every single lecture has been marked complete
        const allComplete = flattenedLectures.every(l => completedIds.includes(String(l.id)));

        if (isInstructor) {
            navigate('/instructor/my-courses');
            return;
        }

        if (allComplete) {
            // First time finishing or revisiting after 100% completion
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

            if (course?.badge) {
                setShowBadgePopup(true);
            } else {
                setTimeout(() => navigate(`/my-enrollments`), 2000);
            }
        } else {
            // Block the 'Finish' action specifically because they want the badge/completion
            alert("You haven't marked all lectures as complete yet! Please go back and check off any missing lessons to earn your badge.");
            setIsProcessing(false);
        }
    };

    const renderSidebarItem = (item: any, depth: number = 0) => {
        const isModule = Array.isArray(item.content);
        if (isModule) {
            const isExpanded = expandedModules[item.id];
            return (
                <div key={item.id}>
                    <div className={`flex justify-between items-center py-2 px-4 cursor-pointer hover:bg-slate-100 ${depth > 0 ? 'pl-8 text-sm' : 'font-bold'}`} onClick={() => setExpandedModules(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                        <span>Module: {item.title}</span>
                        <span className={`text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>▼</span>
                    </div>
                    {isExpanded && item.content.map((child: any) => renderSidebarItem(child, depth + 1))}
                </div>
            );
        }
        const itemIndex = flattenedLectures.findIndex(l => String(l.id) === String(item.id));
        const prevLecture = itemIndex > 0 ? flattenedLectures[itemIndex - 1] : null;
        const isLocked = !isInstructor && itemIndex > 0 && !completedIds.includes(String(prevLecture?.id || ''));
        const isActive = selectedLecture?.id === item.id;
        return (
            <button key={item.id} disabled={isLocked} onClick={() => setSelectedLecture(item)} className={`w-full text-left py-2 px-4 pl-12 text-sm transition-all ${isActive ? 'bg-sky-100 text-sky-700 border-r-4 border-sky-700 font-semibold' : isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-slate-50'}`}>
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

    if (flattenedLectures.length === 0 && course.modules.length > 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white">
                <Loading />
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading course...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-row pr-80 h-screen bg-white overflow-y-hidden">
            <div className="flex-1 flex flex-col min-h-screen">
                <div className="flex-1 overflow-y-auto">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`fixed top-30 right-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-xl transition-all duration-300 ${sidebarOpen ? 'translate-x-[-320px]' : 'translate-x-0'}`}>
                        {sidebarOpen ? '→ Close Sidebar' : '← Open Sidebar'}
                    </button>
                    {!selectedLecture ? (
                        <div className="max-w-3xl mx-auto pt-12 pb-12 px-6">
                            <h1 className="text-4xl font-bold mb-6">{course?.name}</h1>
                            <div className="ql-editor prose max-w-none text-lg text-slate-700" dangerouslySetInnerHTML={{ __html: course?.description || '' }} />
                            {course?.badge && (
                                <div className="mt-10 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-6">
                                    <div className="w-20 h-20 bg-white rounded-full p-2 shadow-sm flex-shrink-0">
                                        <img src={course.badge.displayUrl} alt="Badge" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h3 className="text-amber-900 font-bold">Earn a Badge!</h3>
                                        <p className="text-amber-800 text-sm">Complete all lectures in this course to earn the <span className="font-bold">"{course.badge.name}"</span> achievement for your profile.</p>
                                    </div>
                                </div>
                            )}
                            <button onClick={() => handleNext()} className="mt-8 bg-sky-600 text-white px-8 py-3 rounded-full font-bold hover:bg-sky-700 transition-all shadow-lg"> Start Learning → </button>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto pt-12 pb-12 px-6">
                            <h1 className="text-3xl font-bold border-b pb-4 mb-8">{selectedLecture.title}</h1>
                            <LectureContentRenderer blocks={selectedLecture.blocks || []} />
                        </div>
                    )}
                </div>
                <div className="h-24 bg-white border-t flex items-center justify-between px-12 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex gap-4">
                        {currentIndex > 0 && (
                            <button onClick={() => setSelectedLecture(flattenedLectures[currentIndex - 1])} className="px-6 py-2 border border-slate-300 rounded-full font-bold hover:bg-slate-50 transition-colors"> ← Previous </button>
                        )}
                        {(!selectedLecture || selectedLecture) && isInstructor && (
                            <button onClick={() => navigate(`/instructor/edit-course/${courseId}`)} className="px-6 py-2 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700"> Edit Course </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        {!isInstructor && selectedLecture && !isCurrentComplete && !isCourseFullyComplete && (
                            <button
                                onClick={handleMarkComplete}
                                className="px-8 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-md">
                                Mark as Complete
                            </button>
                        )}
                        <button disabled={isProcessing} onClick={handleNext} className={`px-8 py-2 rounded-full font-bold transition-all ${(isProcessing) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-sky-600 text-white shadow-lg hover:bg-sky-700'}`}>
                            {isProcessing ? 'Processing...' : (!selectedLecture ? 'Start Course' : (currentIndex === flattenedLectures.length - 1 ? 'Finish Course' : 'Next Lecture →'))}
                        </button>
                    </div>
                </div>
            </div>

            {/* SIDEBAR CONTAINER */}
            <div className={`fixed top-25 right-0 w-80 border-l bg-slate-50 transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 pr-0 bg-slate-900 text-white">
                    <h2 className="font-bold truncate">Course: {course?.name}</h2>
                </div>
                <div className="overflow-y-auto h-[calc(100vh-80px)] py-4">
                    <button
                        onClick={() => setSelectedLecture(null)}
                        className={`w-full text-left py-3 px-6 font-bold text-sm border-b transition-colors ${!selectedLecture ? 'bg-sky-600 text-white' : 'hover:bg-slate-200'}`}
                    >
                        🏠 Course Description
                    </button>
                    {course?.modules.map(mod => renderSidebarItem(mod))}
                </div>
            </div>

            {showBadgePopup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="w-32 h-32 bg-gradient-to-tr from-amber-100 to-yellow-50 rounded-full mx-auto mb-6 flex items-center justify-center shadow-inner">
                            <img src={course?.badge?.displayUrl} className="w-24 h-24 object-contain animate-bounce" alt="Earned Badge" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Achievement Unlocked!</h2>
                        <p className="text-slate-600 mb-8">
                            Congratulations! You've earned the <span className="font-bold text-slate-900">{course?.badge?.name}</span> badge.
                            This has been added to your profile library.
                        </p>
                        <button
                            onClick={() => navigate('/my-enrollments')}
                            className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black hover:bg-sky-700 transition-all shadow-lg">
                            Sweet! Take me back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseView;
