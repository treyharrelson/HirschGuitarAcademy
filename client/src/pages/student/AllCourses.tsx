import React, { Children, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { type Course } from '../../types/course'
import { CourseCard } from '../../components/student/CourseCard';


const AllCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');


    const fetchCourses = async () => {
        try {
            const res = await api.get('/api/courses');
            setCourses(res.data);
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
            setEnrolledIds(new Set(res.data.map((e) => e.id)));
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
            setEnrolledIds((prev) => new Set([...prev, courseId]));
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
                next.delete(courseId);
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
            {courses.map((course, index) => (
                <CourseCard course={course} 
                enrolled={enrolledIds.has(course.id) ? "Unenroll" : "Enroll"} 
                buttonclick={enrolledIds.has(course.id) ? () => handleDrop(course.id) : () => handleEnroll(course.id)} />
            ))}
        </>
    );


    if (loading) return <p>Loading courses...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ padding: '1rem' }}>
            <Link to='/student-dashboard'>← Back to Dashboard</Link>
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
