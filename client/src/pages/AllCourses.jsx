import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AllCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [enrolledIds, setEnrolledIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    const fetchCourses = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/courses', { withCredentials: true });
            setCourses(res.data);
        } catch (err) {
            setError('Failed to load courses.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrollments = async () => {
        if (user?.role !== 'student') return;
        try {
            // Uses the new /api/courses/my-enrollments endpoint
            const res = await axios.get('http://localhost:3000/api/courses/my-enrollments', { withCredentials: true });
            setEnrolledIds(new Set(res.data.map((e) => e.courseId)));
        } catch {
            // non-critical — enrollment status just won't show
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchEnrollments();
    }, [user]);

    const handleEnroll = async (courseId) => {
        try {
            await axios.post(`http://localhost:3000/api/courses/${courseId}/enroll`, {}, { withCredentials: true });
            // Update enrolledIds immediately
            setEnrolledIds((prev) => new Set([...prev, courseId]));
            // Re-fetch courses so the enrolled count reflects the change
            await fetchCourses();
            setActionMsg('Successfully enrolled!');
        } catch (err) {
            setActionMsg(err.response?.data?.message || 'Enrollment failed.');
        }
    };

    const handleDrop = async (courseId) => {
        try {
            await axios.delete(`http://localhost:3000/api/courses/${courseId}/enroll`, { withCredentials: true });
            // Update enrolledIds immediately
            setEnrolledIds((prev) => {
                const next = new Set(prev);
                next.delete(courseId);
                return next;
            });
            // Re-fetch courses so the enrolled count reflects the change
            await fetchCourses();
            setActionMsg('Successfully dropped.');
        } catch (err) {
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
                        const isFull = course.enrolled >= course.capacity;

                        return (
                            <li key={course.id} style={{ borderBottom: '1px solid #ddd', padding: '1rem 0' }}>
                                <strong>{course.name}</strong>
                                <p>
                                    Instructor: {course.instructor
                                        ? `${course.instructor.firstName} ${course.instructor.lastName}`
                                        : 'N/A'}
                                </p>
                                <p>Spots: {course.enrolled} / {course.capacity}</p>

                                {user?.role === 'student' && (
                                    isEnrolled ? (
                                        <button onClick={() => handleDrop(course.id)}>Drop Course</button>
                                    ) : (
                                        <button onClick={() => handleEnroll(course.id)} disabled={isFull}>
                                            {isFull ? 'Full' : 'Enroll'}
                                        </button>
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
