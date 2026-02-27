import React from 'react'
import SearchBar from '../../components/student/SearchBar'
import CoursesSection from '../../components/student/CoursesSection'

const Home = () => {
  return (
    <div className='flex flex-col items-center space-y-7'>
      <h1>Home Page</h1>
      <SearchBar />

      <CoursesSection />
    </div>
  )
}

export default Home
