import React, { useContext, useEffect, useRef, useState } from 'react'
import uniqid from 'uniqid';
import Quill from 'quill';
import axios from 'axios';
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import { type Lecture, type Module, type Course } from '../../types/course';



const AddCourse: React.FC = () => {

  const courseId = Number(uniqid());
  
  //const { fetchAllCourses } = useAppContext();
  const quillRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [courseTitle, setCourseTitle] = useState<string>('')
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [image, setImage] = useState<File | string>(assets.defaultCourseThumbnail)
  const [modules, setModules] = useState<Module[]>([])
  const [showPopup, setPopup] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<string>('')

  const [currentModuleId, setCurrentModuleId] = useState<number>(0)
  const [moduleDetails, setModuleDetails] = useState({
    moduleTitle: ''
  })
  type ModuleAction = 'add' | 'remove' | 'toggle';

  const [lectures, setLectures] = useState<Lecture[]>([])
  const [currentLectureId, setCurrentLectureId] = useState<number | null>(null)
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: ''
  })

  const handleModule = (action: ModuleAction, moduleId?: number, currentCourseId?: number): void => {
    if (action === 'add') {
      const title = prompt('Enter Module Name: ');
      if (title && currentCourseId !== undefined) {
        const newModule = {
          id: Number(uniqid()),
          title: title,
          content: [],
          collapsed: false,
          order: modules.length > 0 ? modules.slice(-1)[0].order + 1 : 1,
          courseId: currentCourseId
        };
        setModules([...modules, newModule]);
      }
    } else if (action === 'remove') {
      setModules(modules.filter((module) => module.id !== moduleId));
    } else if (action === 'toggle') {
      setModules(
        modules.map((module) =>
          module.id === moduleId ? { ...module, collapsed: !module.collapsed } : module
        )
      );
    }
  };

  const handleLecture = (action: ModuleAction, moduleId?: number, lectureIndex?: number) => {
    if (action === 'add') {
      if (moduleId !== undefined){
        setCurrentModuleId(moduleId);
        setPopup(true);
      }
    } else if (action === 'remove') {
      if (moduleId !== undefined && lectureIndex !== undefined){
        setModules(
          modules.map((module) => {
            if (module.id === moduleId) {
              module.content.splice(lectureIndex, 1);
            }
          return module;
        })
      );
      }
    }
  };

  const addLecture = () => {
    setModules(
      modules.map((module) => {
        if (module.id === currentModuleId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder: module.content.length > 0 ? module.content.slice(-1)[0].lectureOrder + 1 : 1,
            lectureId: Number(uniqid())
          };
          module.content.push(newLecture);
        }
        return module;
      })
    );
    setPopup(false);
    setLectureDetails({
      lectureTitle: ''
    });
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      setStatusMsg('Please enter a course title.');
      return;
    }
    setSubmitting(true);
    setStatusMsg('');
    try {
      const description = quillRef.current ? quillRef.current.getText() : '';
      await axios.post('http://localhost:3000/api/courses', {
        id: courseId,
        name: courseTitle,
        isPrivate: isPrivate,
        description,
        modules
        //thumbail: image
      }, { withCredentials: true });
      setStatusMsg('Course created successfully!');
      // Refresh the course list
      //await fetchAllCourses();
      // Reset form
      setCourseTitle('');
      setIsPrivate(false);
      setModules([]);
      if (quillRef.current) quillRef.current.setContents([]);
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // Initiate Quill only ONCE
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
      })
    }
  }, [])

  return (
    <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 max-w-md w-full text-gray-500'>

        <div className='flex flex-col gap-1'>
          <p>Course Title</p>
          <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle} type="text" placeholder='Type here'
            className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500' required />
        </div>

        

        <div className='flex flex-col gap-1'>
          <p>Course Description</p>
          <div ref={editorRef}></div>
        </div>


        <div className='flex md:flex-row flex-col items-center gap-3'>
          <p>Course Thumbnail</p>
          <label htmlFor='thumbnailImage' className='flex items-center gap-3'>
            <img src={assets.upload_icon} alt='upload icon' className='p-3 w-10 h-10 fill-white-500 bg-blue-500 rounded' />
            <input type='file' id='thumbnailImage' onChange={(e: React.ChangeEvent<HTMLInputElement>) => {if (e.target.files && e.target.files.length > 0) {setImage(e.target.files[0]);}}} accept='image/*' hidden />
            <img className='max-h-40' src={typeof image === 'string' ? image:  URL.createObjectURL(image)} alt='Course Thumbnail' />
          </label>
        </div>

        {/* Adding Modules and Lectures */}
        <div>
          {modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className='bg-white border rounded-lg mb-4'>
              <div className='flex justify-between items-center p-4 border-b'>
                <div className='flex items-center'>
                  <img onClick={() => handleModule('toggle', module.id, courseId)} src={assets.dropDown_icon} alt='dropdown icon' width={14} className={`mr-2 w-4 h-4 cursor-pointer transition-all ${module.collapsed && "-rotate-90"}`} />
                  <span className='font-semibold'>{moduleIndex + 1} {module.title}</span>
                </div>
                <span className='text-gray-500'>{module.content.length} Lectures</span>
                <img src={assets.cross_icon} alt='cross icon' className='cursor-pointer w-4 h-4' onClick={() => handleModule('remove', module.id)} />
              </div>
              {!module.collapsed && (
                <div className='p-4'>
                  {module.content.map((lecture, lectureIndex) => (
                    <div key={lectureIndex} className='flex justify-between items-center mb-2'>
                      <span>{lectureIndex + 1} {lecture.lectureTitle}</span>
                      <img src={assets.cross_icon} alt='cross icon' className='cursor-pointer w-4 h-4' onClick={() => handleLecture('remove', module.id, lectureIndex)} />
                    </div>
                  ))}
                  <div className='inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2' onClick={() => handleLecture('add', module.id)}>
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className='flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer' onClick={() => handleModule('add')}>+ Add Module</div>

          {showPopup && (
            <div className='fixed inset-0 flex items-center justify-center bg-gray-800/50 '>
              <div className='bg-white text-gray-700 p-4 rounded relative w-full max-w-80'>
                <h2 className='text-lg font-semibold mb-4'>Add Lecture</h2>

                <div className='mb-2'>
                  <p>Lecture Title</p>
                  <input
                    type='text'
                    className='mt-1 block w-full border rounded py-1 px-2'
                    value={lectureDetails.lectureTitle}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                  />
                </div>

                {/** Other input fields come in as seperate divs, will be changing the lecture creation soon so dont worry about it */}

                <button onClick={() => addLecture()} type='button' className='w-full bg-blue-400 text-white px-4 py-2 rounded cursor-pointer'>Add</button>

                <img onClick={() => setPopup(false)} src={assets.cross_icon} alt='cross icon' className='absolute top-4 right-4 w-4 h-4 cursor-pointer' />

              </div>
            </div>
          )}

        </div>

        {
        // Making course private on creation?
        }
        <div className='flex items-center'>
          <ul className='flex'>
            <li><input type='checkbox' name='privateCourse' checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)}/></li>
            <li><p>Make course private?</p></li>
          </ul>
        </div>

        <button
          type='submit'
          disabled={submitting}
          className='bg-black text-white w-max py-2.5 px-8 rounded my-4 disabled:opacity-50'
        >
          {submitting ? 'Creating...' : 'ADD COURSE'}
        </button>
        {statusMsg && (
          <p className={statusMsg.includes('success') ? 'text-green-600' : 'text-red-500'}>{statusMsg}</p>
        )}
      </form>
    </div>
  )
}

export default AddCourse
