import React, { useContext, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext' // to get user and check auth

const CourseDetails = () => {

  const { id } = useParams()

  const [courseData, setCourseData] = useState(null)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollMessage, setEnrollMessage] = useState('')

  const { allCourses, isCoursesLoaded } = useContext(AppContext)
  const { user, isAuthenticated } = useAuth() // Need to check if auth in the future if guest views are allowed

  const fetchCourseData = async () => {
    // Note: The id coming from useParams is a string, but our database id is likely an integer. So use == instead of ===
    const findCourse = allCourses.find(course => course.id == id)
    setCourseData(findCourse)
  }

  useEffect(() => {
    fetchCourseData()
  }, [allCourses, id])


  const handleEnroll = async () => {
    setIsEnrolling(true)
    setEnrollMessage('')
    try {
      const response = await axios.post(`http://localhost:3000/api/courses/${id}/enroll`, {}, {
        withCredentials: true
      })
      setEnrollMessage("Successfully enrolled!")
      // optionally refresh courses or something here
    } catch (err) {
      setEnrollMessage(err.response?.data?.message || "Failed to enroll")
    } finally {
      setIsEnrolling(false)
    }
  }

  if (isCoursesLoaded && !courseData) return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] text-center px-4'>
      <h1 className='text-4xl font-bold text-gray-800 mb-4'>Course Not Found</h1>
      <p className='text-gray-500 mb-8'>We couldn't find the course you were looking for.</p>
      <Link to='/course-list' className='bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition'>
        Browse Courses
      </Link>
    </div>
  )

  return courseData ? (
    <>
      <div className='flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left'>
        <div className='absolute top-0 left-0 w-full -z-1 bg-gradient-to-b from-cyan-100/70'></div>
        {/* Left Col */}
        <div className='max-w-xl z-10 text-gray-500'>
          <h1 className='font-semibold text-gray-800 text-3xl'>{courseData.name}</h1>
          <p className='pt-4 md:text-base text-sm'>
            Instructor: {courseData.instructor ? `${courseData.instructor.firstName} ${courseData.instructor.lastName}` : "TBA"}
          </p>
          <p className='pt-2'>Capacity: {courseData.enrolled} / {courseData.capacity}</p>
        </div>

        { /* Right Col */}
        <div className='z-10 bg-white p-6 rounded shadow-md w-full max-w-sm flex flex-col items-center border border-gray-100'>
          <h2 className='text-xl mb-4 font-semibold'>Enroll Now</h2>
          <button
            onClick={handleEnroll}
            disabled={isEnrolling || courseData.enrolled >= courseData.capacity}
            className='bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer'
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll in Course'}
          </button>
          {enrollMessage && <p className='mt-2 text-sm text-center text-blue-800'>{enrollMessage}</p>}
        </div>
      </div>
    </>
  ) : <Loading />
}

export default CourseDetails
