import React from 'react'

const CourseCard = () => {
  return (
    <div className={'w-[250px] h-[200px] border-2 border-gray border-solid rounded-md p-0 m-0 overflow-hidden shrink-0'}>
      <img src='' alt='Course Img' />
      <div className='py-18'>
        <h3 className='course-title'>Course Title</h3>
        <div className='course-details'>
          <p>Course Details go here</p>
        </div>
        <p>Course Progress Bar here?</p>
        <a href={`courses/${CourseCard.id}`} className='bg-blue-600 text-white px-2 rounded-md'>View Course</a>
      </div>
    </div>
  )
}

export default CourseCard
