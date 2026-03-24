import React from 'react'
import { Link } from 'react-router-dom'
import { type Course } from '../../types/course'
import { assets } from '../../assets/assets'
import { BigBlueButton } from '../generic/Buttons'

type CourseCardProps = {
  course: Course;
  enrolled: string;
  buttonclick: () => void;
};

export const CourseCard = ({ course, enrolled, buttonclick }: CourseCardProps) => {
  return (
    <div className='flex flex-col aspect-square p-5 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white overflow-hidden group'>
    <Link 
      to={`/course/${course.id}`}
      onClick={() => scrollTo(0, 0)}
      // aspect-square forces the 1:1 ratio. Flexbox handles the internal layout.
      
    >

      {/* Top Section: Image and Title side-by-side */}
      <div className='flex items-start gap-4 mb-4'>
        <img
          className='w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100'
          src={String(course.thumbnail) ? assets.defaultCourseThumbnail : assets.defaultCourseThumbnail}
          alt='Course Img'
        />
        <div>
          <h3 className='text-base font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors'>
            {course.name}
          </h3>
          <p className='text-sm text-gray-500 mt-1'>
            {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Unknown Instructor'}
          </p>
        </div>
      </div>

      <div className='flex-grow text-sm text-gray-600'>
        <p>Course Details go here</p>
      </div>
      </Link>

      <div>
        <BigBlueButton children={enrolled} onClick={buttonclick} />
      </div>

      {/* For progress bar */}
      {/* <div className='mt-auto pt-4 border-t border-gray-100 w-full'>
        <p className='text-xs font-medium text-gray-500 mb-1 text-right'>45% Complete</p>
        <div className='w-full bg-gray-100 rounded-full h-2'>
          <div className='bg-blue-500 h-2 rounded-full' style={{ width: '45%' }}></div>
        </div>
      </div> */}

    
    </div>
  )
}