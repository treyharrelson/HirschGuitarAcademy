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
  progressValue?: number;
};

export const CourseCard = ({
  course,
  enrolled,
  buttonclick,
  missingRequirements = [],
  isCompleted = false,
  progressValue = 0
}: CourseCardProps) => {
  const [imageUrl, setImageUrl] = useState<string>(assets.defaultCourseThumbnail);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isInstructor = user?.role === 'instructor';
  const isEnrolled = enrolled?.toLowerCase() !== "enroll";
  const isFinished = isCompleted || progressValue === 100;

  useEffect(() => {
    let isMounted = true;
    const loadThumbnail = async () => {
      const R2_FOLDERS = ['forum/', 'course-thumbnails/', 'lecture-content/', 'profile-pictures/'];
      if (course.thumbnail && typeof course.thumbnail === 'string' && R2_FOLDERS.some(p => course.thumbnail?.startsWith(p))) {
        try {
          const res = await api.get(`/api/upload/file-url`, { params: { fileKey: course.thumbnail } });
          if (isMounted && res.data.presignedUrl) setImageUrl(res.data.presignedUrl);
        } catch (err) {
          console.error("Thumbnail error:", err);
        }
      }
    };
    loadThumbnail();
    return () => { isMounted = false; };
  }, [course.thumbnail]);

  return (
    <div className='flex flex-col w-60 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white group overflow-hidden'>
      <Link to={`/course/${course.id}`} className='flex flex-col'>
        <div className='h-32 w-full overflow-hidden bg-gray-50'>
          <img
            className='w-full h-full object-cover'
            src={imageUrl}
            alt={course.name}
            onError={() => setImageUrl(assets.defaultCourseThumbnail)}
          />
        </div>


        <div className='p-1 flex flex-col'>
          <h3 className='text-base font-bold text-gray-800 line-clamp-1 leading-tight group-hover:text-blue-600 h-5 mb-1'>
            {course.name}
          </h3>

          {/* PROGRESS BAR */}
          {!isInstructor && isEnrolled && (
            <div className="pt-2 flex flex-col items-center justify-center">
              <>
                <div className="w-48 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isFinished ? 'bg-emerald-500' : 'bg-sky-500'}`}
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-bold mt-0.5">{progressValue}%</span>
              </>
            </div>)}

          {/* DESCRIPTION */}
          <div className='text-sm text-gray-600 ql-snow'>
            <div
              className='ql-editor p-0 !min-h-0 
                line-clamp-2 !overflow-hidden 
                leading-[1.6rem] max-h-[3.2rem]
                [&_p]:inline [&_p]:m-0 [&_p]:after:content-["\00a0"]'
              dangerouslySetInnerHTML={{ __html: course.description }} />
          </div>
        </div>
      </Link>
      
      {/* BUTTONS */}
      <div className='px-3 pb-3 mt-auto flex items-center gap-2'>
        {!isInstructor ? (
          <BigBlueButton
            children={isFinished ? "Review" : enrolled}
            onClick={isFinished ? () => navigate(`/course/${course.id}`) : buttonclick}
            disabled={missingRequirements.length > 0}/>
        ) : (
          <>
            <button
              onClick={() => navigate(`/instructor/edit-course/${course.id}`)}
              className="px-2 py-2 bg-slate-800 text-white rounded-full text-xs font-bold hover:bg-slate-700 transition cursor-pointer">
              ⚙️ Edit Course
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this course?")) {
                  buttonclick();
                }
              }}
              className="px-4 py-2 border border-blue-200 text-white bg-blue-600 rounded-full text-xs font-bold hover:bg-blue-700 transition cursor-pointer">
              🗑️ Delete
            </button>
          </>
        )}
      </div>

      {missingRequirements.length > 0 && (
        <div className='px-3 pb-2 text-[10px] text-red-500 font-medium leading-tight'>
          Requires: {missingRequirements.join(', ')}
        </div>
      )}
    </div>
  )
}