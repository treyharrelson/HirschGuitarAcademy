import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type Course } from '../../types/course'
import { assets } from '../../assets/assets'
import { BigBlueButton } from '../generic/Buttons'
import api from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import "quill/dist/quill.snow.css";

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
  const navigate = useNavigate();

  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';

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
    <div className='pb-2 flex flex-col w-60 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white group'>
      <Link
        to={`/course/${course.id}`}
        onClick={() => scrollTo(0, 0)}
        className='flex flex-col flex-grow'
      >

        {/* COURSE THUMBNAIL */}
        <div className='flex items-start pb-2'>
          <img
            className='w-full object-cover rounded-t flex-shrink-0 border border-gray-100'
            src={imageUrl}
            alt={`${course.name} Thumbnail`}
          />
        </div>

        {/* COURSE NAME */}
        <div className='pl-2'>
          <h3 className='text-base font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors overflow-hidden'>
            {course.name}
          </h3>
        </div>

        {/* DESCRIPTION */}
        <div className='text-sm text-gray-600 ql-snow mt-1 flex-grow overflow-hidden pb-2'>
          <div
            className='ql-editor p-0 !min-h-0 max-h-[3.2rem] leading-[1.6rem] !overflow-hidden line-clamp-2 [&_p]:inline [&_p]:m-0 [&_p]:after:content-["\00a0"]' dangerouslySetInnerHTML={{ __html: course.description }}/>
        </div>
      </Link>

      { /* BUTTONS */}
      <div className='px-3 pb-2 flex items-center gap-2'>
        <BigBlueButton children={enrolled} onClick={missingRequirements.length > 0 ? undefined : buttonclick} disabled={missingRequirements.length > 0} />
        {enrolled === "Unenroll" && isCompleted && (
          <span className="text-emerald-500 font-bold text-lg" title="Completed">✓</span>
        )}

        {isInstructor && (
          <button onClick={() => navigate(`/instructor/edit-course/${course.id}`)} className="px-4 py-1 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700 cursor-pointer">
            Edit Course
          </button>
        )}

      </div>
      {missingRequirements.length > 0 && (
        <div className='px-2 pb-2 text-xs text-red-500 font-medium whitespace-normal leading-tight'>
          Requires: {missingRequirements.join(', ')}
        </div>
      )}

    </div>
  )
}