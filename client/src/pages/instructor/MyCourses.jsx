import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import Loading from '../../components/student/Loading'

const MyCourses = () => {

  const { allCourses, fetchAllCourses } = useContext(AppContext)
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  // Assuming the user object has the same integer id as the DB
  const myCourses = allCourses ? allCourses.filter(c => c.instructorId === user?.id) : []

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    setIsDeleting(true)
    try {
      await axios.delete(`http://localhost:3000/api/courses/${courseId}`, {
        withCredentials: true
      })
      // Refresh the course list from the server
      await fetchAllCourses()
      // Ideally refresh the allCourses context context here
    } catch (err) {
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
        <div className='overflow-x-auto rounded-lg border border-gray-200'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Course ID</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Name</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Enrolled</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {myCourses.map((course) => (
                <tr key={course.id}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>#{course.id}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{course.name}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{course.enrolled} / {course.capacity}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm'>
                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={isDeleting}
                      className='text-red-600 hover:text-red-900 cursor-pointer disabled:opacity-50'
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default MyCourses
