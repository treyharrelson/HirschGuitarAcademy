import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Course } from '../types/course'


const AllCourses: React.FC = () => {
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
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {courses.map((course) => {
                        const isEnrolled = enrolledIds.has(course.id);

                        return (
                            <li key={course.id} style={{ borderBottom: '1px solid #ddd', padding: '1rem 0' }}>
                                <strong>{course.name}</strong>
                                <p>
                                    Instructor: {course.instructorId
                                        ? `${course.instructorId} ${course.instructorId}`
                                        : 'N/A'}
                                </p>
                                <p>Enrolled: {course.enrolled}</p>

                                {user?.role === 'student' && (
                                    isEnrolled ? (
                                        <button onClick={() => handleDrop(course.id)}>Drop Course</button>
                                    ) : (
                                        <button onClick={() => handleEnroll(course.id)}>Enroll</button>
                                    )
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default AllCourses;
