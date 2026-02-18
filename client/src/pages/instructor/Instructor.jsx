import React from 'react'
import { Outlet } from 'react-router-dom'

const Instructor = () => {
  return (
    <div>
      <h1>Instructor Page</h1>
      <div>
        {<Outlet />}
      </div>
    </div>
  )
}

export default Instructor
