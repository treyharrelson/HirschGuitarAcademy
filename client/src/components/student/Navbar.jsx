import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/HGA_Logo_No_Background.png'

const Navbar = () => {

  const isCourseListPage = location.pathname.includes('/course-list');

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-200 sticky top-0 z-40 py-4 bg-white` }>
      <Link to='/' >
        <img src={logo} alt='Logo goes here' className='w-28 lg:w-32 cursor-pointer' />
      </Link>
      <div className='hidden md:flex items-center gap-5 text-gray-500'>
        <div>
            {/*<Link to='/instructor/add-course' className="underline text-blue-600 hover:text-blue-800" >Testing Course Creation </Link>*/}
        </div>
        <div className='flex items-center gap-5'>
          <Link to='/instructor'>Instructor View (Dev Mode)</Link>
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
