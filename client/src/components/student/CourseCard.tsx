import React from 'react'
import { Link } from 'react-router-dom'
import { type Course } from '../../types/course'
import { assets } from '../../assets/assets'

interface CourseCardProps {
  course: Course; 
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link to={'/course/' + course.id} onClick={() => scrollTo(0, 0)}
      className='border border-gray-500/30 pb-6 overflow-hidden rounded-lg'>
      <img className='w-full' src={String(course.thumbnail) ? assets.defaultCourseThumbnail : assets.defaultCourseThumbnail} alt='Course Img' />
      <div className='p-3 text-left'>
        <h3 className='text-base font-semibold'>{course.name}</h3>
        <p className='text-gray-500'>
          {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Unknown Instructor'}
        </p>
        <div>
          <p>Course Details go here</p>
        </div>
        <p>Course Progress Bar here?</p>
      </div>
    </Link>
  )
}

export default CourseCard
