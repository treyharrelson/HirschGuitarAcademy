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
  missingRequirements?: string[];
  isCompleted?: boolean;
};

export const CourseCard = ({ course, enrolled, buttonclick, missingRequirements = [], isCompleted = false }: CourseCardProps) => {
  const [imageUrl, setImageUrl] = useState<string>(assets.defaultCourseThumbnail);
  const R2_FOLDERS = ['forum/', 'course-thumbnails/', 'lecture-content/', 'profile-pictures/'];
  const isFileKey = (val: string) => R2_FOLDERS.some(p => val.startsWith(p));

  useEffect(() => {
    let isMounted = true;
    const loadThumbnail = async () => {
      if (course.thumbnail && typeof course.thumbnail === 'string' && isFileKey(course.thumbnail)) {
        try {
          const res = await api.get(`/api/upload/file-url`, { params: { fileKey: course.thumbnail } });
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
    <div className='pb-2 flex flex-col w-60 aspect-square border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white group'>
      <Link 
        to={`/course/${course.id}`}
        onClick={() => scrollTo(0, 0)}
        className='flex flex-col flex-grow'
      >

      {/* Top Section: Image */}
      <div className='flex items-start'>
        <img
          className='w-full object-cover rounded-t flex-shrink-0 border border-gray-100'
          src={imageUrl}
          alt={`${course.name} Thumbnail`}
        />
      </div>
      <div className='pl-2'>
          <h3 className='text-base font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors overflow-hidden'>
            {course.name}
          </h3>
      </div>

      <div className='flex-grow text-sm text-gray-600 pl-2'>
        <p>Course Details go here</p>
      </div>
      </Link>

      <div className='pl-2 pb-1 flex items-center gap-2'>
        <BigBlueButton children={enrolled} onClick={missingRequirements.length > 0 ? undefined : buttonclick} disabled={missingRequirements.length > 0} />
        {enrolled === "Unenroll" && isCompleted && (
          <span className="text-emerald-500 font-bold text-lg" title="Completed">✓</span>
        )}
      </div>
      {missingRequirements.length > 0 && (
        <div className='px-2 pb-2 text-xs text-red-500 font-medium whitespace-normal leading-tight'>
          Requires: {missingRequirements.join(', ')}
        </div>
      )}

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