import React, { useContext, useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { Link, useParams } from 'react-router-dom'
import SearchBar from '../../components/student/SearchBar'
import { CourseCard } from '../../components/student/CourseCard'
import { type Course } from '../../types/course';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { assets } from '../../assets/assets'

const CourseList: React.FC = () => {
  const { user } = useAuth();
  const { input } = useParams<{ input?: string }>()
  //const { allCourses } = useAppContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourse, setFilteredCourse] = useState<Course[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses && courses.length > 0) {
      const formatInput = input?.toLowerCase() || '';
      const filtered = input ? courses.filter(item => item.name.toLowerCase().includes(formatInput)) : courses;
      setFilteredCourse(filtered);
    } else {
      setFilteredCourse([]);
    }
    fetchCourses();
  }, [input, courses])

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <>
      <div className='relative md:px-36 px-8 pt-20 text-left'>
        <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
          <div>
            <h1 className='text-4xl font-semibold text-gray-800'>Course List</h1>
            <p className='text-gray-500'>
              <Link to='/' className='text-blue-600 cursor-pointer'>Home</Link>/ <span>Course List</span>
            </p>
          </div>
          <SearchBar data={input} />
        </div>

        {input && <div className='inline-flex items-center gap-4 px-4 py-2 border mt-8 mb-8 text-gray-600'>
          <p>{input}</p>
          <Link to='/course-list' className='cursor-pointer'><img src={assets.cross_icon} alt='cross icon' className='w-4 h-4' /></Link>
        </div>
        }

        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-16 gap-3 px-2 md:p-0'>
          {filteredCourse.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      </div>
    </>
  )
}

export default CourseList