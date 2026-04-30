import React, { useContext, useEffect, useRef, useState } from 'react'
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import api from '../../api/axiosInstance';
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import { useCourseEditor } from '../../hooks/useCourseEditor'
import { useNavigate } from 'react-router-dom'
import MediaBlockEditor from '../../components/instructor/MediaBlockEditor';

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const { state, handlers, refs, setters } = useCourseEditor();
  const { fetchAllCourses, allCourses } = useAppContext();

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<string>('')
  const [contentType, setContentType] = useState<string>('Lecture')

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!state.courseTitle.trim()) {
      setStatusMsg('Please enter a course title.');
      return;
    }
    setSubmitting(true);
    setStatusMsg('');

    try {
      const thumbnailKey = state.image || null;

      const description = refs.quillRef.current ? refs.quillRef.current.getText() : '';

      const response = await api.post('/api/courses', {
        name: state.courseTitle,
        isPrivate: state.isPrivate,
        description,
        modules: state.modules,
        thumbnail: thumbnailKey || null,
        requirements: state.courseRequirements
      }, { withCredentials: true });

      setStatusMsg('Course created successfully!');

      // Refresh the course list
      await fetchAllCourses();

      const newCourseId = response.data.course?._id || response.data._id || response.data.id;
      if (newCourseId) {
        navigate(`/instructor/edit-course/${newCourseId}`)
      } else {
        // Reset form
        setters.setCourseTitle('');
        setters.setIsPrivate(false);
        setters.setModules([]);
        setters.setCourseRequirements([]);
        if (refs.quillRef.current) refs.quillRef.current.setContents([]);
      }

    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  const [charCount, setCharCount] = useState(0);
  const MAX_LENGTH = 2048;
  useEffect(() => {
    // Initiate Quill only ONCE
    if (!refs.quillRef.current && refs.editorRef.current) {
      const quill = new Quill(refs.editorRef.current, {
        theme: 'snow',
      });
      refs.quillRef.current = quill;

      // Listen for text changes to enforce the limit
      quill.on('text-change', () => {
        const length = quill.getLength() - 1; // Subtract trailing newline
        setCharCount(length);

        if (length > MAX_LENGTH) {
          quill.deleteText(MAX_LENGTH, length);
          setCharCount(MAX_LENGTH);
        }
      });
    }

    if (state.showPopup) {
      refs.inputRef.current?.focus();
    }
  }, [state.showPopup]);

  return (
    <div className='w-full flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-10'>
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Create a New Course</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-6 w-full text-gray-500 pb-20'>

        {/* COURSE TITLE */}
        <div className='flex flex-col gap-1'>
          <p className='font-medium'>Course Title</p>
          <input
            onChange={e => setters.setCourseTitle(e.target.value)}
            value={state.courseTitle}
            type="text"
            maxLength={64}
            className='outline-none py-2 px-3 rounded border border-gray-400 text-black'
          />
        </div>
        {/* MAIN DESCRIPTION */}
        <div className='flex flex-col gap-1'>
          <div className='flex justify-between items-end'>
            <p className='font-medium'>Course Description</p>
            <p className={`text-[10px] font-bold ${charCount >= MAX_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
              {charCount} / {MAX_LENGTH}
            </p>
          </div>
          <div className='w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden'>
            <div ref={refs.editorRef} className="bg-white min-h-[200px]"></div>
          </div>
        </div>

        {/* COURSE THUMBNAIL */}
        <div className='flex flex-col gap-3 mb-8 w-full'>
          <p className='font-bold text-gray-700 text-lg'>Course Thumbnail</p>

          <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white group relative">
            <MediaBlockEditor
              //key={Image ? 'preview' : 'input'} // This forces a full UI reset
              type="image"
              folder="course-thumbnails"
              url={typeof state.image === 'string' ? state.image : assets.defaultCourseThumbnail}
              onUploadSuccess={(fileKey) => {
                setters.setImage(fileKey);
              }}
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="p-1 bg-gray-100 rounded-full text-gray-400">ℹ️</span>
            <p className="text-xs text-gray-400">
              Recommended: 16:9 aspect ratio (1280x720px for best quality)
            </p>
          </div>
        </div>

        {/* COURSE REQUIREMENTS */}
        <div className='flex flex-col gap-2'>
          <p className='font-bold text-gray-700'>Course Prerequisites</p>

          {/* The Flex-Wrap container makes them sit side-by-side */}
          <div className='flex flex-wrap gap-2 w-full'>
            {allCourses.length === 0 ? (
              <p className='text-sm text-gray-400 italic'>No courses available</p>
            ) : (
              allCourses.map(course => {
                const isChecked = state.courseRequirements.includes(String(course.id));

                return (
                  <label
                    key={course.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer text-sm font-medium ${isChecked
                      ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type='checkbox'
                      className="hidden" // Hide the actual box for a cleaner "button" look
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setters.setCourseRequirements([...state.courseRequirements, String(course.id)]);
                        } else {
                          setters.setCourseRequirements(state.courseRequirements.filter(id => id !== String(course.id)));
                        }
                      }}
                    />
                    {/* Visual Indicator (Optional: adds a checkmark if you want) */}
                    {isChecked && <span>✓</span>}
                    {course.name}
                  </label>
                );
              })
            )}
          </div>
        </div>

        <button
          type='submit'
          disabled={submitting}
          className='bg-black text-white w-max py-2.5 px-8 rounded my-4 disabled:opacity-50'
        >
          {submitting ? 'Creating...' : 'CREATE NEW COURSE'}
        </button>
        {statusMsg && (
          <p className={statusMsg.includes('success') ? 'text-green-600' : 'text-red-500'}>{statusMsg}</p>
        )}
      </form>
    </div>
  )
}

export default AddCourse