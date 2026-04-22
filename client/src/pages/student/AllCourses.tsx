import React, { Children, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { type Course } from '../../types/course'
import { CourseCard } from '../../components/student/CourseCard';
import Loading from '../../components/student/Loading';


const AllCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
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
            // Uses the new /api/courses/my-enrollments endpoint
            const res = await api.get<Course[]>('/api/courses/my-enrollments');
            const data = Array.isArray(res.data) ? res.data : [];
            setEnrolledIds(new Set(data.map((e) => String(e.id))));
            setCompletedIds(new Set(data.filter(e => e.completed).map((e) => String(e.id))));
        } catch {
            // non-critical — enrollment status just won't show
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchEnrollments();
    }, [user]);

    const handleEnroll = async (courseId: string): Promise<void> => {
        try {
            await api.post(`/api/courses/${courseId}/enroll`, {});
            // Update enrolledIds immediately
            setEnrolledIds((prev) => new Set([...prev, String(courseId)]));
            // Re-fetch courses so the enrolled count reflects the change
            await fetchCourses();
            setActionMsg('Successfully enrolled!');
        } catch (err: any) {
            setActionMsg(err.response?.data?.message || 'Enrollment failed.');
        }
    };

    const handleDrop = async (courseId: string): Promise<void> => {
        try {
            await api.delete(`/api/courses/${courseId}/enroll`);
            // Update enrolledIds immediately
            setEnrolledIds((prev) => {
                const next = new Set(prev);
                next.delete(String(courseId));
                return next;
            });
            // Re-fetch courses so the enrolled count reflects the change
            await fetchCourses();
            setActionMsg('Successfully dropped.');
        } catch (err: any) {
            setActionMsg(err.response?.data?.message || 'Drop failed.');
        }
    };


    const RenderCourses = () => (
        <>
            {courses.map((course) => {
                const stringCourseId = String(course.id);
                const isEnrolled = enrolledIds.has(stringCourseId);
                const isCompleted = completedIds.has(stringCourseId);
                const missingRequirements = course.requirements?.filter((req: any) => !completedIds.has(String(req.id))).map((req: any) => req.name) || [];
                return (
                    <CourseCard 
                        key={course.id}
                        course={course} 
                        enrolled={isEnrolled ? "Unenroll" : "Enroll"} 
                        buttonclick={isEnrolled ? () => handleDrop(stringCourseId) : () => handleEnroll(stringCourseId)} 
                        missingRequirements={isEnrolled ? [] : missingRequirements}
                        isCompleted={isCompleted}
                    />
                );
            })}
        </>
    );


    if (loading) return <Loading />;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ padding: '1rem' }}>
            <Link to='/home'>← Back to Dashboard</Link>
            <h1>Available Courses</h1>

            {actionMsg && <p style={{ color: 'green' }}>{actionMsg}</p>}

            {courses.length === 0 ? (
                <p>No courses available.</p>
            ) : (
                <ul className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 list-none p-0'>
                    <RenderCourses />
                </ul>
            )}
        </div>
    );
};

export default AllCourses;
