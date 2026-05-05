import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { type Course } from '../../types/course';
import { CourseCard } from '../../components/student/CourseCard';
import Loading from '../../components/student/Loading';

const AllCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    const fetchCourses = async () => {
        try {
            const res = await api.get('/api/courses');
            setCourses(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError('Failed to load courses.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrollments = async (): Promise<void> => {
        if (user?.role !== 'student') return;
        try {
            const res = await api.get<any[]>('/api/courses/my-enrollments');
            const data = Array.isArray(res.data) ? res.data : [];

            // Use courseId from your enrollment route
            setEnrolledIds(new Set(data.map((e) => String(e.courseId))));
            setCompletedIds(new Set(data.filter(e => e.completed).map((e) => String(e.courseId))));

            const pMap = new Map();
            data.forEach(e => pMap.set(String(e.courseId), e.progress));
            setProgressMap(pMap);
        } catch {
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchEnrollments();
    }, [user]);

    const handleEnroll = async (courseId: string): Promise<void> => {
        try {
            await api.post(`/api/courses/${courseId}/enroll`, {});
            setActionMsg('Successfully enrolled!');
            fetchEnrollments(); // Refresh statuses
            fetchCourses();
        } catch (err: any) {
            setActionMsg(err.response?.data?.message || 'Enrollment failed.');
        }
    };

    const handleDrop = async (courseId: string): Promise<void> => {
        try {
            await api.delete(`/api/courses/${courseId}/enroll`);
            setActionMsg('Successfully dropped.');
            fetchEnrollments();
            fetchCourses();
        } catch (err: any) {
            setActionMsg(err.response?.data?.message || 'Drop failed.');
        }
    };

    const RenderCourses = () => (
        <>
            {courses.map((course) => {
                const stringId = String(course.id);
                const isEnrolled = enrolledIds.has(stringId);
                const isCompleted = completedIds.has(stringId);
                const progress = progressMap.get(stringId) || 0;
                const missingRequirements = course.requirements?.filter((req: any) => !completedIds.has(String(req.id))).map((req: any) => req.name) || [];

                return (
                    <CourseCard
                        key={course.id}
                        course={course}
                        enrolled={isEnrolled ? "Unenroll" : "Enroll"}
                        isCompleted={isCompleted}
                        progressValue={progress}
                        buttonclick={isEnrolled ? () => handleDrop(stringId) : () => handleEnroll(stringId)}
                        missingRequirements={isEnrolled ? [] : missingRequirements}
                    />
                );
            })}
        </>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white">
                <Loading />
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading courses...</p>
            </div>
        );
    }


    return (
        <div className='p-4'>

            <h1 className="text-2xl font-bold my-4">Available Courses</h1>
            {actionMsg && <p className="mb-4 text-green-600 font-medium">{actionMsg}</p>}
            <ul className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 list-none p-0'>
                <RenderCourses />
            </ul>
        </div>
    );
};

export default AllCourses;