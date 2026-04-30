import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/instructor/Sidebar'

const Instructor = () => {
  return (
    <div>
      {<Outlet />}
    </div>
  )
}

export default Instructor
