import React, { useContext, useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import Loading from '../../components/student/Loading';
import { CourseCard } from '../../components/student/CourseCard';

const MyCourses: React.FC = () => {
  const { allCourses, fetchAllCourses } = useAppContext();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      if (!allCourses || allCourses.length === 0) {
        await fetchAllCourses();
      }
      setInitialLoading(false);
    };
    init();
  }, [allCourses, fetchAllCourses]);

  const handleDelete = async (courseId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/courses/${courseId}`);
      await fetchAllCourses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  if (initialLoading && (!allCourses || allCourses.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    );
  }

  const myCourses = allCourses ? allCourses.filter(c => String(c.instructor?.id) === String(user?.id)) : [];

  return (
    <div className='p-8 relative'>
      {isDeleting && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center backdrop-blur-[1px]">
          <Loading />
        </div>
      )}

      <h1 className='text-2xl font-semibold mb-6'>My Published Courses</h1>
      
      {myCourses.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-12 px-4 text-center">
          <p className='text-gray-500 font-medium'>You have not published any courses yet.</p>
        </div>
      ) : (
        <ul className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 list-none p-0'>
          {myCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              enrolled={isDeleting ? "..." : "Delete"} 
              buttonclick={() => handleDelete(course.id)} 
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyCourses;