import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Course } from '../types/course';

interface Enrollment {
  courseId: number;
}

const MyCourses: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [actionMsg, setActionMsg] = useState<string>('');

    const fetchMyCourses = async (): Promise<void> => {
        try {
            // Fetch enrolled course IDs
            const enrollRes = await api.get<Enrollment[]>('/api/courses/my-enrollments');
            const enrolledIds = new Set(enrollRes.data.map((e) => e.courseId));

            if (enrolledIds.size === 0) {
                setCourses([]);
                return;
            }

            // Fetch all courses and filter to enrolled ones
            const courseRes = await api.get('/api/courses');
            const myCourses = courseRes.data.filter((c: Course) => enrolledIds.has(c.id));
            setCourses(myCourses);
        } catch (err) {
            setError('Failed to load your courses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, [user]);

    const handleDrop = async (courseId: number) => {
        try {
            await api.delete(`/api/courses/${courseId}/enroll`);
            setActionMsg('Successfully dropped.');
            await fetchMyCourses(); // refresh list
        } catch (err: any) {
            setActionMsg(err.response?.data?.message || 'Drop failed.');
        }
    };

    if (loading) return <p>Loading your courses...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ padding: '1rem' }}>
            <Link to='/student-dashboard'>← Back to Dashboard</Link>
            <h1>My Courses</h1>

            {actionMsg && <p style={{ color: 'green' }}>{actionMsg}</p>}

            {courses.length === 0 ? (
                <div>
                    <p>You are not enrolled in any courses yet.</p>
                    <Link to='/all-courses'>Browse available courses</Link>
                </div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {courses.map((course) => (
                        <li key={course.id} style={{ borderBottom: '1px solid #ddd', padding: '1rem 0' }}>
                            <strong>{course.name}</strong>
                            <p>
                                Instructor: {course.instructor
                                    ? `${course.instructor.firstName} ${course.instructor.lastName}`
                                    : 'N/A'}
                            </p>
                            <p>Enrolled: {course.enrolled}</p>
                            {user?.role === 'student' && (
                                <button onClick={() => handleDrop(course.id)}>Drop Course</button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MyCourses;
