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

  const [searchCourses, setSearchCourses] = useState<any[]>([]);
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await api.get('/api/courses'); // Assuming this returns all courses
        setSearchCourses(res.data);
      } catch (err) {
        console.error("Failed to load course library", err);
      }
    };
    fetchLibrary();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCourses = searchCourses.filter(course => {
    if (!searchQuery) return true;
    return course.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

  useEffect(() => {
    // Initiate Quill only ONCE
    if (!refs.quillRef.current && refs.editorRef.current) {
      refs.quillRef.current = new Quill(refs.editorRef.current, {
        theme: 'snow',
      })
    }
    if (state.showPopup) {
      refs.inputRef.current?.focus();
    }
  }, [state.showPopup])

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
            className='outline-none py-2 px-3 rounded border border-gray-400 text-black'
          />
        </div>
        {/* MAIN DESCRIPTION */}
        <div className='flex flex-col gap-1'>
          <p className='font-medium'>Course Description</p>
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

        {/* COURSE PREREQUISITES */}
        <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Course Prerequisites</h2>
            <p className="text-sm text-gray-500">Select courses that must be completed before this one.</p>
          </div>

          {/* Search & Browse Input Area */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search or browse all courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563eb] outline-none font-medium transition-all" />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
          </div>

          {/* RESULTS DROPDOWN */}
          <div className="mb-8 flex flex-col">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {searchQuery ? `Search Results (${filteredCourses.length})` : "Browse All Courses"}
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-2xl bg-white shadow-inner p-2 custom-scrollbar">
              {filteredCourses.length > 0 ? (
                filteredCourses.map(course => {
                  const isChecked = state.courseRequirements.includes(String(course.id));
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        if (!isChecked) {
                          setters.setCourseRequirements([...state.courseRequirements, String(course.id)]);
                        } else {
                          setters.setCourseRequirements(state.courseRequirements.filter(id => id !== String(course.id)));
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all ${isChecked ? 'bg-blue-50 text-[#2563eb]' : 'hover:bg-gray-50 text-gray-700'
                        }`}>
                      <span className="font-bold">{course.name}</span>
                      {isChecked ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-tighter">Required</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">Add +</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm italic">
                  No courses match your search.
                </div>
              )}
            </div>
          </div>

          {/* CURRENTLY SELECTED LIST (Tags) */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] px-1">Selected Prerequisites</span>
            <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              {state.courseRequirements.length > 0 ? (
                state.courseRequirements.map(reqId => {
                  const course = allCourses.find(c => String(c.id) === String(reqId));
                  return (
                    <div key={reqId} className="flex items-center gap-2 bg-white border border-gray-200 pl-4 pr-2 py-1.5 rounded-full shadow-sm animate-in fade-in zoom-in duration-200">
                      <span className="text-xs font-bold text-gray-700">{course?.name || 'Unknown Course'}</span>
                      <button
                        onClick={() => setters.setCourseRequirements(state.courseRequirements.filter(id => id !== reqId))}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center text-gray-400 text-xs italic px-2">No prerequisites selected.</div>
              )}
            </div>
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