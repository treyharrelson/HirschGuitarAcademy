import React from 'react'
import SearchBar from '../../components/student/SearchBar'
import CoursesSection from '../../components/student/CoursesSection'
import Navbar from '../../components/generic/Navbar'

const Home = () => {
  return (
    <div>
      
      <div className='flex flex-col items-center space-y-7'>
      
        <h1>Home Page</h1>
        <SearchBar />

        <CoursesSection />
      </div>
    </div>
    
  )
}

export default Home
