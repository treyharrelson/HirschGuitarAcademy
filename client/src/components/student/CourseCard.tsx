import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Course } from '../../types/course'
import { assets } from '../../assets/assets'
import { BigBlueButton } from '../generic/Buttons'
import api from '../../api/axiosInstance'

type CourseCardProps = {
  course: Course;
  enrolled: string;
  buttonclick: () => void;
};

export const CourseCard = ({ course, enrolled, buttonclick }: CourseCardProps) => {
  const [imageUrl, setImageUrl] = useState<string>(assets.defaultCourseThumbnail);

  useEffect(() => {
    let isMounted = true;
    const loadThumbnail = async () => {
      if (course.thumbnail && typeof course.thumbnail === 'string' && course.thumbnail.startsWith('uploads/')) {
        try {
          const res = await api.get(`/api/upload/file-url?fileKey=${course.thumbnail}`);
          if (isMounted && res.data.presignedUrl) {
            setImageUrl(res.data.presignedUrl);
          }
        } catch (err) {
          console.error("Failed to fetch presigned URL for thumbnail:", err);
        }
      }
    };
    loadThumbnail();
    return () => { isMounted = false; };
  }, [course.thumbnail]);

  return (
    <div className='flex flex-col aspect-square p-5 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white overflow-hidden group'>
    <Link 
      to={`/course/${course.id}`}
      onClick={() => scrollTo(0, 0)}
      className='flex flex-col flex-grow'
    >

      {/* Top Section: Image and Title side-by-side */}
      <div className='flex items-start'>
        <img
          className='w-full object-cover rounded-lg flex-shrink-0 border border-gray-100'
          src={imageUrl}
          alt={`${course.name} Thumbnail`}
        />
      </div>
      <div>
          <h3 className='text-base font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors'>
            {course.name}
          </h3>
          <p className='text-sm text-gray-500 mt-1'>
            {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Unknown Instructor'}
          </p>
      </div>

      <div className='flex-grow text-sm text-gray-600'>
        <p>Course Details go here</p>
      </div>
      </Link>

      <div className=''>
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