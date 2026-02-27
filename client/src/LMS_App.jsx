import React from 'react'
import { Route, Routes, useMatch } from 'react-router-dom'
import Home from './pages/student/Home'
import CourseList from './pages/student/CourseList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollments from './pages/student/MyEnrollments'
import Player from './pages/student/Player'
import Loading from './components/student/Loading'
import Instructor from './pages/instructor/Instructor'
import Dashboard from './pages/instructor/Dashboard'
import AddCourse from './pages/instructor/AddCourse'
import MyCourses from './pages/instructor/MyCourses'
import StudentsEnrolled from './pages/instructor/StudentsEnrolled'
import Navbar from './components/student/Navbar'
import CourseCard from './components/student/CourseCard'
import "quill/dist/quill.snow.css";



const LMS_App = () => {

  const isInstructorRoute = useMatch('/instructor/*');

  return (
    <div className='text-default min-h screen bg-white'>
      {!isInstructorRoute && <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/course-list' element={<CourseList />} />
        <Route path='/course-list/ :input' element={<CourseList />} />
        <Route path='/course/:id' element={<CourseDetails />} />
        <Route path='/my-enrollments' element={<MyEnrollments />} />
        <Route path='/player/:courseId' element={<Player />} />
        <Route path='/loading/:path' element={<Loading />} />

        <Route path='/instructor' element={<Instructor />}>
          <Route path='/instructor' element={<Dashboard />} />
          <Route path='add-course' element={<AddCourse />} />
          <Route path='my-courses' element={<MyCourses />} />
          <Route path='students-enrolled' element={<StudentsEnrolled />} />
        </Route>
      </Routes>
    </div>
  )
}

export default LMS_App
