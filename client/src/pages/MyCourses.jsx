import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MyCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    const fetchMyCourses = async () => {
        try {
            // Fetch enrolled course IDs
            const enrollRes = await axios.get('http://localhost:3000/api/courses/my-enrollments', { withCredentials: true });
            const enrolledIds = new Set(enrollRes.data.map((e) => e.courseId));

            if (enrolledIds.size === 0) {
                setCourses([]);
                return;
            }

            // Fetch all courses and filter to enrolled ones
            const courseRes = await axios.get('http://localhost:3000/api/courses', { withCredentials: true });
            const myCourses = courseRes.data.filter((c) => enrolledIds.has(c.id));
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

    const handleDrop = async (courseId) => {
        try {
            await axios.delete(`http://localhost:3000/api/courses/${courseId}/enroll`, { withCredentials: true });
            setActionMsg('Successfully dropped.');
            await fetchMyCourses(); // refresh list
        } catch (err) {
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
                            <p>Spots: {course.enrolled} / {course.capacity}</p>
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
