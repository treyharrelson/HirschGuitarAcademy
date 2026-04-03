import React, { useContext, useEffect, useRef, useState } from 'react'
import uniqid from 'uniqid';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { assets } from '../assets/assets'
import { type Lecture, type Module } from '../types/course';


export const useCourseEditor = (initialData?: any) => {
  const [courseId] = useState(uniqid());

  const newId = () => {return uniqid();}

  // States
  const [courseTitle, setCourseTitle] = useState(initialData?.title || '')
  const [isPrivate, setIsPrivate] = useState<boolean>(initialData?.isPrivate || false)
  const [image, setImage] = useState<File | string>(initialData?.thumbnail || assets.defaultCourseThumbnail)
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
  const [currentSubModuleIndex, setCurrentSubModuleIndex] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>(initialData?.modules || [])
  const [lectureDetails, setLectureDetails] = useState({ lectureTitle: '' })

  // UI States
  const [showPopup, setPopup] = useState<boolean>(false)
  const [popupType, setPopupType] = useState<'Module' | 'SubModule' | 'Lecture'>('Lecture')

  // References
  const inputRef = React.useRef<HTMLInputElement>(null);
  const quillRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  type ModuleAction = 'add' | 'remove' | 'toggle' | 'save';
  
  // Helper Functions
  const updateModuleById = (moduleId: string | null, callback: (module: Module) => Module) => {
    if (!moduleId) return;
    setModules((prev) =>
      prev.map((m) => (String(m.id) === String(moduleId) ? callback(m) : m))
    );
  };

  const createItem = (title: string, currentLength: number, type: 'Module' | 'Lecture', parentId?: string) => ({
    id: uniqid(),
    title,
    order: currentLength+1,
    ...(type === 'Module' ? { content: [], collapsed: false, courseId } : { content: '', module_Id: parentId})
  });

  const handleModule = (action: ModuleAction, moduleId?: string): void => {
      if (action === 'add') {
        setPopupType('Module');
        setPopup(true);
        return;
      } else if (action === 'remove' && moduleId) {
        setModules((prev) => prev.filter((m) => String(m.id) !== String(moduleId)));
      } else if (action === 'toggle' && moduleId) {
        updateModuleById(moduleId, (m) => ({ ...m, collapsed: !m.collapsed }));
    }
  };

  const handleLecture = (action: ModuleAction, moduleId?: string, index?: number, subIndex?: number) => {
    const title = lectureDetails.lectureTitle.trim();
    // Add lecture
    if (action === 'add' && moduleId){
      setCurrentModuleId(moduleId);
      setCurrentSubModuleIndex(index ?? null);
      setPopupType('Lecture');
      setPopup(true);
      return;
    }
    if (action === 'save' && title) {
      if (popupType === 'Module') {
        setModules(prev => [...prev, createItem(title, prev.length, 'Module') as Module]);
      } else {
        updateModuleById(currentModuleId!, (module): Module => {
          const itemType = popupType === 'SubModule' ? 'Module' : 'Lecture';
          const newItem = createItem(title, module.content.length, itemType as any, module.id) as (Module | Lecture);
          
          // Adding to a Sub-Module?
          if (popupType === 'Lecture' && currentSubModuleIndex !== null) {
              const updatedContent = [...module.content];
              const subMod = { ...(updatedContent[currentSubModuleIndex] as Module) };
              subMod.content = [
                  ...subMod.content, 
                  createItem(title, subMod.content.length, 'Lecture', module.id) as Lecture
              ];
              updatedContent[currentSubModuleIndex] = subMod;
              return { ...module, content: updatedContent };
          }
          // Adding to Parent Module?
          return { 
              ...module, 
              content: [...module.content, newItem] 
          };
        });
      }
      // Reset UI States
      setPopup(false);
      setLectureDetails({ lectureTitle: '' });
      setCurrentSubModuleIndex(null);
    }
    if (action === 'remove' && moduleId && index !== undefined) {
        updateModuleById(moduleId, (module) => {
          if (subIndex !== undefined){
            const updatedContent = [...module.content];
            const subMod = { ...(updatedContent[index] as Module) };
            subMod.content = subMod.content.filter((_, si) => si !== subIndex);
            updatedContent[index] = subMod;
            return { ...module, content: updatedContent };
          }
          return { ...module, content: module.content.filter((_, i) => i != index) };
        });
      }
  };

  const handleSubModule = (action: ModuleAction, moduleId: string, index?: number): void => {
      if (action === 'add'){
        setCurrentModuleId(moduleId);
        setPopupType('SubModule');
        setPopup(true);
        return;
      }
      updateModuleById(moduleId, (module) => {
        if (action === 'remove' && index !== undefined) {
          return { ...module, content: module.content.filter((_, i) => i !== index) };
        }
        if (action === 'toggle' && index !== undefined){
          const updatedContent = [...module.content];
          const subMod = { ...(updatedContent[index] as Module) };
          if ('collapsed' in subMod) subMod.collapsed = !subMod.collapsed;
          updatedContent[index] = subMod;
          return { ...module, content: updatedContent};
        }
        return module;
      });
  };

  const handleContent = (input: string, action: ModuleAction, modId?: string) => {
      if (input === 'Lecture'){
        handleLecture(action, modId);
      } else if (input === 'SubModule' && modId !== undefined) {
        handleSubModule(action, modId)
      }
  };

  return {
    state: { courseTitle, isPrivate, image, modules, showPopup, popupType, lectureDetails },
    setters: { setCourseTitle, setIsPrivate, setImage, setModules, setPopup, setLectureDetails },
    refs: { inputRef, quillRef, editorRef },
    handlers: { handleModule, handleSubModule, handleLecture, handleContent },
    newId
  };
};