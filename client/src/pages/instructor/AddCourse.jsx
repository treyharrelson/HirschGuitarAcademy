import React, { useEffect, useRef, useState } from 'react'
import uniqid from 'uniqid';
import Quill from 'quill';
import { assets } from '../../assets/assets'


const AddCourse = () => {

  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState('')
  const [image, setImage] = useState(null)
  const [modules, setModules] = useState([])
  const [showPopup, setPopup] = useState(false)
  const [showIfPrivate, setIfPrivate] = useState(false)
  const [currentModuleId, setCurrentModuleId] = useState(null)

  const [moduleDetails, setModuleDetails] = useState({
    moduleTitle: ''
  })

  const [lectures, setLectures] = useState([])
  const [currentLectureId, setCurrentLectureId] = useState(null)
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: ''
  })

  const handleModule = (action, moduleId) => {
    if (action === 'add') {
      const title = prompt('Enter Module Name: ');
      if (title) {
        const newModule = {
          moduleId: uniqid(),
          moduleTitle: title,
          moduleContent: [],
          collapsed: false,
          moduleOrder: modules.length > 0 ? modules.slice(-1)[0].moduleOrder + 1 : 1,
        };
        setModules([...modules, newModule]);
      }
    } else if (action === 'remove'){
      setModules(modules.filter((module)=>module.moduleId !== moduleId));
    } else if (action === 'toggle') {
      setModules(
        modules.map((module)=>
          module.moduleId === moduleId ? { ...module, collapsed: !module.collapsed } : module
        )
      );
    }
  };

  const handleLecture = (action, moduleId, lectureIndex) => {
    if (action === 'add') {
      setCurrentModuleId(moduleId);
      setPopup(true);
    } else if (action === 'remove') {
      setModules(
        modules.map((module)=> {
          if(module.moduleId === moduleId) {
            module.moduleContent.splice(lectureIndex, 1);
          }
          return module;
        })
      );
    }
  };

  const addLecture = () => {
    setModules(
      modules.map((module)=> {
        if(module.moduleId === currentModuleId){
          const newLecture = {
            ...lectureDetails,
            lectureOrder: module.moduleContent.length > 0 ? module.moduleContent.slice(-1)[0].lectureOrder + 1 : 1,
            lectureId: uniqid()
          };
          module.moduleContent.push(newLecture);
        }
        return module;
      })
    );
    setPopup(false);
    setLectureDetails({
      lectureTitle: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
  };

  useEffect(()=>{
    // Initiate Quill only ONCE
    if(!quillRef.current && editorRef.current){
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
      })
    }
  },[])

  return (
    <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <form className='flex flex-col gap-4 max-w-md w-full text-gray-500'>

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
            <img src={assets.upload_icon} alt='upload icon' className='p-3 w-10 h-10 fill-white-500 bg-blue-500 rounded'/>
            <input type='file' id='thumbnailImage' onChange={e => setImage(e.target.files[0])} accept='image/*' hidden />
            <img className='max-h-10' src={image ? URL.createObjectURL(image) : ''} alt='' />
          </label>
        </div>
        
        {/* Adding Modules and Lectures */}
        <div>
          {modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className='bg-white border rounded-lg mb-4'>
              <div className='flex justify-between items-center p-4 border-b'>
                <div className='flex items-center'>
                  <img onClick={()=> handleModule('toggle', module.moduleId)} src={assets.dropDown_icon} alt='dropdown icon' width={14} className={`mr-2 w-4 h-4 cursor-pointer transition-all ${module.collapsed && "-rotate-90"}`}/>
                  <span className='font-semibold'>{moduleIndex + 1} {module.moduleTitle}</span>
                </div>
                <span className='text-gray-500'>{module.moduleContent.length} Lectures</span>
                <img src={assets.cross_icon} alt='cross icon' className='cursor-pointer w-4 h-4' onClick={()=>handleModule('remove', module.moduleId)}/>
              </div>
              {!module.collapsed && (
                <div className='p-4'>
                  {module.moduleContent.map((lecture, lectureIndex)=>(
                    <div key={lectureIndex} className='flex justify-between items-center mb-2'>
                      <span>{lectureIndex + 1} {lecture.lectureTitle}</span>
                      <img src={assets.cross_icon} alt='cross icon' className='cursor-pointer w-4 h-4' onClick={()=>handleLecture('remove', module.moduleId, lectureIndex)}/>
                    </div>
                  ))}
                  <div className='inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2' onClick={()=>handleLecture('add', module.moduleId)}>
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className='flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer' onClick={()=> handleModule('add')}>+ Add Module</div>

          {showPopup && (
            <div className='fixed inset-0 flex items-center justify-center bg-gray-800/50 '>
              <div className='bg-white text-gray-700 p-4 rounded relative w-full max-w-80'>
                <h2 className='text-lg font-semibold mb-4'>Add Lecture</h2>

                <div className='mb-2'>
                  <p>Lecture Title</p>
                  <input 
                    type='text'
                    className='mt-1 block w-full border rounded py-1 px-2'
                    vlaue={lectureDetails.lectureTitle}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                  />
                </div>

                {/** Other input fields come in as seperate divs, will be changing the lecture creation soon so dont worry about it */}

                <button onClick={() => addLecture()} type='button' className='w-full bg-blue-400 text-white px-4 py-2 rounded cursor-pointer'>Add</button>

                <img onClick={() => setPopup(false)} src={assets.cross_icon} alt='cross icon' className='absolute top-4 right-4 w-4 h-4 cursor-pointer'/>

              </div>
            </div>
          )}

        </div>
          <button type='submit' className='bg-black text-white w-max py-2.5 px-8 rounded my-4'>ADD</button>
      </form>
    </div>
  )
}

export default AddCourse
