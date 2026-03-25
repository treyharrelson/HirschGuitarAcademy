import React, { useContext, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axiosInstance';
import Loading from '../../components/student/Loading'
import { CourseCard } from '../../components/student/CourseCard'

const MyCourses: React.FC = () => {

  const { allCourses, fetchAllCourses } = useAppContext();
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  // Assuming the user object has the same integer id as the DB
  const myCourses = allCourses ? allCourses.filter(c => c.instructorId == user?.id) : []

  const handleDelete = async (courseId: string | number): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    setIsDeleting(true)
    try {
      await api.delete(`/api/courses/${courseId}`)
      // Refresh the course list from the server
      await fetchAllCourses()
      // Ideally refresh the allCourses context context here
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete course")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!allCourses) return <Loading />

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-semibold mb-6'>My Published Courses</h1>

      {myCourses.length === 0 ? (
        <p className='text-gray-500'>You have not published any courses yet.</p>
      ) : (
        <ul className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 list-none p-0'>
            {myCourses.map((course) => (
                <CourseCard 
                    key={course.id}
                    course={course}
                    enrolled={isDeleting ? "…" : "Delete"}
                    buttonclick={() => handleDelete(course.id)} 
                />
            ))}
        </ul>
      )}
    </div>
  )
}

export default MyCourses
