import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import CourseCard from './CourseCard'
import { AppContext } from '../../context/AppContext'

const CoursesSection = () => {

  const {allCourses} = useContext(AppContext)

  return (
    <div className='py-16 md:px-40 px-8'>
      <div>
        <h2 className='flex items-center justify-center text-3xl font-medium text-gray-800'>This is filler text!</h2>
        <p className='flex items-center justify-center text-sm md:text-base text-gray-500 mt-3'>Fusce a dolor ipsum. Donec et leo non metus scelerisque accumsan. Vestibulum efficitur ipsum iaculis, pellentesque elit id, dignissim risus. Nullam a magna consequat, malesuada risus ac, pretium risus. Vivamus ac faucibus sem. Morbi elementum non dui non consequat. Quisque semper dignissim hendrerit. Etiam dictum, sapien vitae rutrum mollis, tellus lorem commodo lorem, sed iaculis ipsum ligula nec ante.</p>
      </div>
      
      <div className='grid grid-cols-4 px-4 md:px-0 md:my-16 my-10 gap-4'>
        {allCourses.map((course, index)=> <CourseCard key={index} course={course}/>)}
      </div>

      <div className='flex w-full items-center justify-center'>
      <Link to={'/course-list'} onClick={()=> scrollTo(0,0)} 
      className='text-gray-500 border border-gray-500/30 px-10 py-3 rounded'
      >Show all courses</Link>
      </div>
    </div>
  )
}

export default CoursesSection
