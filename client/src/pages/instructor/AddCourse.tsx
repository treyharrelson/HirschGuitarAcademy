import React, { useContext, useEffect, useRef, useState } from 'react'
import uniqid from 'uniqid';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import api from '../../api/axiosInstance';
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import { type Lecture, type Module } from '../../types/course';

const AddCourse: React.FC = () => {

  const courseId = uniqid();

  const newId = () => {
    return uniqid();
  }
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const quillRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const { fetchAllCourses } = useAppContext();
  
  const [courseTitle, setCourseTitle] = useState('')
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [image, setImage] = useState<File | string>(assets.defaultCourseThumbnail)
  const [modules, setModules] = useState<Module[]>([])
  const [showPopup, setPopup] = useState<boolean>(false)
  const [popupType, setPopupType] = useState<'Module' | 'SubModule' | 'Lecture'>('Lecture')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<string>('')
  const [contentType, setContentType] = useState<string>('Lecture')


  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
  const [currentSubModuleIndex, setCurrentSubModuleIndex] = useState<number | null>(null);
  
  type ModuleAction = 'add' | 'remove' | 'toggle' | 'save';

  const [lectureDetails, setLectureDetails] = useState({ lectureTitle: '' })

  const handleModule = (action: ModuleAction, moduleId?: string): void => {
    if (action === 'add') {
      setPopupType('Module');
      setPopup(true);
    } else if (action === 'remove') {
      setModules(modules.filter((module) => String(module.id) !== String(moduleId)));
    } else if (action === 'toggle') {
      setModules((prev) =>
        prev.map((m) =>
          String(m.id) === String(moduleId) ? { ...m, collapsed: !m.collapsed } : m
        )
      );
    }
  };

  const handleLecture = (action: ModuleAction, moduleId?: string, index?: number, subIndex?: number) => {
    if (action === 'add' && moduleId !== undefined) {
      setCurrentModuleId(moduleId);
      setCurrentSubModuleIndex(index !== undefined ? index : null);
      setPopupType('Lecture');
      setPopup(true);
      return;
    }
    if (action === 'save'){
      if (!lectureDetails.lectureTitle.trim()) return;

      if (popupType === 'Module') {
        const newModule = {
          id: uniqid(),
          title: lectureDetails.lectureTitle,
          content: [],
          collapsed: false,
          order: modules.length > 0 ? modules.slice(-1)[0].order + 1 : 1,
          courseId: courseId
        };
        setModules([...modules, newModule]);
      } else if (popupType === 'SubModule') {
        setModules((prevModules) => 
          prevModules.map((module) => {
            if (String(module.id) === String(currentModuleId)){
              const newSubModule: Module = {
                id: uniqid(),
                title: lectureDetails.lectureTitle,
                content: [],
                collapsed: false,
                order: module.content.length > 0 ? module.content.length + 1 : 1,
                courseId: courseId
              };
              return { ...module, content: [...module.content, newSubModule]};
            }
            return module;
          })
        );
      } else if (popupType === 'Lecture') {
        setModules((prev) =>
        prev.map((module) => {
          if (String(module.id) === String(currentModuleId)){
            if (currentSubModuleIndex !== null){
              const targetItem = module.content[currentSubModuleIndex];
              if (targetItem && 'collapsed' in targetItem && Array.isArray(targetItem.content) ){
                const updateContent = module.content.map((item, idx) => {
                  if (idx === currentSubModuleIndex && 'collapsed' in item && Array.isArray(item.content)) {
                    const newLec: Lecture = {
                      id: uniqid(),
                      title: lectureDetails.lectureTitle,
                      order: item.content.length + 1, // Order relative to submodule
                      content: '',
                      module_Id: module.id
                    };
                    return { ...item, content: [...item.content, newLec] } as Module;
                  }
                  return item;
                });
                return { ...module, content: updateContent };
              }            
            }

            // Adding to Parent Module
            const newLecture: Lecture = {
              id: uniqid(),
              title: lectureDetails.lectureTitle,
              order: module.content.length + 1,
              content: '',
              module_Id: module.id
            };
            return { ...module, content: [...module.content, newLecture] };
          }
          return module;
        })
      );
      }

      setPopup(false);
      setCurrentSubModuleIndex(null);
      setLectureDetails({ lectureTitle: '' });
      return;
    }

  // STEP 3: REMOVE
  if (action === 'remove' && moduleId !== undefined && index !== undefined) {
    setModules((prev) =>
      prev.map((module) => {
        if (String(module.id) === String(moduleId)) {
          
          // Case: Remove from SubModule (requires 4th arg: subIndex)
          if (subIndex !== undefined) {
            return {
              ...module,
              content: module.content.map((item, i) => {
                if (i === index && 'collapsed' in item && Array.isArray(item.content)) {
                  return { ...item, content: item.content.filter((_, si) => si !== subIndex) };
                }
                return item;
              })
            };
          }

          // Case: Remove from Parent Module
          return {
            ...module,
            content: module.content.filter((_, i) => i !== index)
          };
        }
        return module;
      })
    );
  }
};

  const handleSubModule = (action: ModuleAction, moduleId: string, index?: number): void => {
    setModules((prevModules) => 
      prevModules.map((module) => {
        if (String(module.id) === String(moduleId)){
          // ADD NEW SUBMODULE
          if (action === 'add'){
            setCurrentModuleId(moduleId);
            setPopupType('SubModule');
            setPopup(true);
            return module;
          }
           // REMOVE SUBMODULE
          if (action === 'remove' && index !== undefined){
            return {
              ...module, content: module.content.filter((_, i) => i != index)
            };
          } 
          // TOGGLE VISIBILITY
          if (action === 'toggle' && index !== undefined){
            return {
              ...module, content: module.content.map((item, i) => i === index && 'collapsed' in item ? { ...item, collapsed: !item.collapsed} : item)};
          }
        }
        return module;
      })
    );
  };

  const handleContent = (input: string, action: ModuleAction, modId?: string) => {
    if (input === 'Lecture'){
      handleLecture(action, modId);
    } else if (input === 'SubModule' && modId !== undefined) {
      handleSubModule(action, modId)
    }
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
      let thumbnailKey = '';
      if (image && typeof image !== 'string') {
          const formData = new FormData();
          formData.append('file', image);
          
          const uploadRes = await api.post('/api/upload/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              withCredentials: true
          });
          thumbnailKey = uploadRes.data.fileKey;
      } else if (typeof image === 'string' && image !== assets.defaultCourseThumbnail) {
          thumbnailKey = image;
      }

      const description = quillRef.current ? quillRef.current.getText() : '';
      await api.post('/api/courses', {
        id: courseId,
        name: courseTitle,
        isPrivate: isPrivate,
        description,
        modules,
        thumbnail: thumbnailKey || null
      }, { withCredentials: true });
      setStatusMsg('Course created successfully!');
      // Refresh the course list
      await fetchAllCourses();
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
    if (showPopup){
      inputRef.current?.focus();
    }
  }, [showPopup])

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

        {/* COURSE THUMBNAIL */}
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
                  <img 
                    onClick={() => handleModule('toggle', module.id)}  
                    src={assets.dropDown_icon} 
                    alt='dropdown icon'  
                    width={14} 
                    className={`mr-2 w-4 h-4 cursor-pointer transition-all ${module.collapsed && "-rotate-90"}`} 
                  />
                  {/* Display Module Number and Title */}
                  <span className='font-semibold'>{moduleIndex + 1}: {module.title}</span>
                </div>
                <span className='text-gray-500'>Content</span>
                <img src={assets.cross_icon} alt='cross icon' className='cursor-pointer w-4 h-4' onClick={() => handleModule('remove', module.id)} />
              </div>

              {!module.collapsed && (
                <div className='p-4'>
                  {module.content.map((item, index) => {
                    const isSubModule = 'collapsed' in item && Array.isArray(item.content);
                    if (isSubModule){
                      return (
                        <div key={index} className='mb-4 ml-4 p-2 border-l-2 border-blue-200 bg-gray-50/50'>
                          <div className='flex justify-between items-center font-semibold text-gray-700'>
                            <img 
                              onClick={(e) => {e.stopPropagation(); handleSubModule('toggle', module.id, index)}}  
                              src={assets.dropDown_icon} 
                              alt='dropdown icon'  
                              width={14} 
                              className={`mr-2 w-4 h-4 cursor-pointer transition-all ${item.collapsed && "-rotate-90"}`} 
                            />
                            <span>SubModule: {item.title}</span>
                            <img src={assets.cross_icon} alt='cross icon' className='ml-auto cursor-pointer w-4 h-4' onClick={(e) => {e.stopPropagation(); handleSubModule('remove', module.id, index)}} />
                            
                          </div>
                          <div className='ml-4 mt-2'>
                          {!item.collapsed && Array.isArray(item.content) && item.content.map((subLecture, subIndex) => (
                            <div key={subIndex} className='flex text-sm text-gray-500 py-1'>
                              {index + 1}.{subIndex + 1}: {subLecture.title}
                              <img src={assets.cross_icon} alt='cross icon' className='ml-auto cursor-pointer w-4 h-4' onClick={() => handleLecture('remove', module.id, index, subIndex)} />
                            </div>
                          ))}
                          {!item.collapsed && (
                            <div 
                              className='inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2' 
                              onClick={() => {handleLecture('add', module.id, index)}}>
                              + Add Lecture
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className='flex justify-between items-center mb-2'>
                        {/* Display Lecture Number and Title */}
                        <span>{index + 1}: {item.title}</span>
                        <img src={assets.cross_icon} alt='cross icon' className='cursor-pointer w-4 h-4' onClick={() => handleLecture('remove', module.id, index)} />
                      </div>
                     );
                    })}
                  <div className='inline-flex bg-gray-100 p-1 rounded-md cursor-pointer mt-2' onClick={() => handleContent(contentType, 'add', module.id)}>
                    + Add Content
                  </div>
                  <select className='border rounded-md' value={contentType} onChange={(e) => setContentType(e.target.value)}>
                      <option value="Lecture">Lecture</option>
                      <option value="SubModule">SubModule</option> 
                  </select>
                </div>
              )}
            </div>
          ))}

          <div className='flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer' onClick={() => handleModule('add', newId())}>+ Add Module</div>
          
          {/* CONTENT TITLE POPUP */}
          {showPopup && (
            <div className='fixed inset-0 flex items-center justify-center bg-gray-800/50 '>
              <div className='bg-white text-gray-700 p-4 rounded relative w-full max-w-80'>
                <h2 className='text-lg font-semibold mb-4'>Add {popupType}</h2>

                <div className='mb-2'>
                  <p>{popupType} Title</p>
                  <input
                    ref={inputRef}
                    type='text'
                    className='mt-1 block w-full border rounded py-1 px-2'
                    value={lectureDetails.lectureTitle}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                    // Prevent form submission by pressing the ENTER key
                    onKeyDown={(e)=>{
                      if (e.key === 'Enter'){
                        e.preventDefault();  // Prevents the form from submitting/refreshing
                        handleLecture('save');
                      }
                    }}
                  />
                </div>

                {/** Other input fields come in as seperate divs, will be changing the lecture creation soon so dont worry about it */}

                <button onClick={() => handleLecture('save')} type='button' className='w-full bg-blue-400 text-white px-4 py-2 rounded cursor-pointer'>Add</button>

                <img onClick={() => setPopup(false)} src={assets.cross_icon} alt='cross icon' className='absolute top-4 right-4 w-4 h-4 cursor-pointer' />

              </div>
            </div>
          )}

        </div>

        {/* MAKE COURSE PRIVATE??? */}
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