import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {

  const isCourseListPage = location.pathname.includes('/course-list');

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-200 sticky top-0 z-40 py-4 'bg-white'` }>
      <img src='' alt='Logo goes here' className='w-28 lg:w-32 cursor-pointer' />
      <div className='hidden md:flex items-center gap-5 text-gray-500'>
        <div className='flex items-center gap-5'>
          <button>Become Instructor</button>
            <Link to='/my-enrollments' >My Enrollments</Link>
        </div>
        <button className='bg-blue-600 text-white px-5 py-2 rounded-full' >Create Account</button>
      </div>
      {/* For phone screens */}
      <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
        <div>
          <button>Become Instructor</button>
            <Link to='/my-enrollments' >My Enrollments</Link>
        </div>
        <button><img src='' alt='User Icon' /></button>
      </div> 
    </div>
  )
}

export default Navbar
