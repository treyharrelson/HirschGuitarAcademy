import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/instructor/Sidebar'

const Instructor = () => {
  return (
    <div>
      <div className='flex'>
        <Sidebar />
        <div className='flex-1 pl-75'>
          {<Outlet />}
        </div>
      </div>
    </div>
  )
}

export default Instructor
