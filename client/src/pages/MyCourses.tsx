import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/useAuth';
import { type Course } from '../types/course';
import { CourseCard } from '../components/student/CourseCard';
import Loading from '../components/student/Loading';


const MyCourses: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [actionMsg, setActionMsg] = useState<string>('');

    const fetchMyCourses = async (): Promise<void> => {
        try {
            // Fetch enrolled course IDs
            const myCourses = await api.get('/api/courses/my-enrollments');
            setCourses(Array.isArray(myCourses.data) ? myCourses.data : []);
        } catch (err) {
            setError('Failed to load your courses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, [user]);

    const handleDrop = async (courseId: string) => {
        try {
            await api.delete(`/api/courses/${courseId}/enroll`);
            setActionMsg('Successfully dropped.');
            await fetchMyCourses(); // refresh list
        } catch (err: any) {
            setActionMsg(err.response?.data?.message || 'Drop failed.');
        }
    };

    const RenderCourses = () => (
        <>
            {courses.map((course, index) => (
                <CourseCard course={course}
                    key={course.id}
                    enrolled={"Unenroll"}
                    isCompleted={!!course.completed}
                    buttonclick={() => handleDrop(course.id)} />
            ))}
        </>
    );

    if (loading) return <Loading />;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ padding: '1rem' }}>

            <h1>My Courses</h1>

            {actionMsg && <p style={{ color: 'green' }}>{actionMsg}</p>}

            {courses.length === 0 ? (
                <div>
                    <p>You are not enrolled in any courses yet.</p>
                    <Link to='/all-courses'>Browse available courses</Link>
                </div>
            ) : (
                <ul className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 list-none p-0'>
                    <RenderCourses />
                </ul>
            )}
        </div>
    );
};

export default MyCourses;
