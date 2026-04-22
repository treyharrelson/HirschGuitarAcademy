import React, { useContext, useEffect, useRef, useState } from 'react'
import uniqid from 'uniqid';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { assets } from '../assets/assets'
import { type Lecture, type Module } from '../types/course';


export const useCourseEditor = (initialData?: any) => {
  const [courseId] = useState(uniqid());

  // States
  const [courseTitle, setCourseTitle] = useState(initialData?.title || '')
  const [isPrivate, setIsPrivate] = useState<boolean>(initialData?.isPrivate || false)
  const [image, setImage] = useState<File | string>(initialData?.thumbnail || assets.defaultCourseThumbnail)
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
  const [currentSubModuleIndex, setCurrentSubModuleIndex] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>(initialData?.modules || [])
  const [lectureDetails, setLectureDetails] = useState({ lectureTitle: '' })
  const [courseDescription, setCourseDescription] = useState("");

  const [courseRequirements, setCourseRequirements] = useState<string[]>(initialData?.requirements?.map((r: any) => String(r.id)) || [])

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

  const createItem = (
    title: string,
    currentLength: number,
    type: 'Module' | 'SubModule' | 'Lecture',
    parentId?: string
  ): Module | Lecture => {
    const base = {
      id: uniqid(),
      title,
      order: currentLength + 1,
    };

    if (type === 'Module' || type === 'SubModule') {
      return {
        ...base,
        content: [],
        collapsed: false,
        courseId: courseId,
      } as Module;
    } else {
      return {
        ...base,
        blocks: [],
        module_Id: parentId || '',
      } as Lecture;
    }
  };


  const handleModule = (action: ModuleAction, moduleId?: string): void => {
    if (action === 'add') {
      setPopupType('Module');
      setPopup(true);
      return;
    } else if (action === 'remove' && moduleId) {
      setModules((prev) => prev.filter((m) => String(m.id) !== String(moduleId)));
    }
  };

  const handleLecture = (action: ModuleAction, moduleId?: string, index?: number, subIndex?: number) => {
    const title = lectureDetails.lectureTitle.trim();
    // Add lecture
    if (action === 'add' && moduleId) {
      setCurrentModuleId(moduleId);
      setCurrentSubModuleIndex(index ?? null);
      setPopupType('Lecture');
      setPopup(true);
      return;
    }
    if (action === 'save' && title) {
      if (popupType === 'Module') {
        // 1. Create a top-level Module
        setModules(prev => [...prev, createItem(title, prev.length, 'Module') as Module]);
      } else {
        updateModuleById(currentModuleId!, (module): Module => {

          // 2. Add a lecture INTO an existing Sub-Module
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

          // 3. Create either a Sub-Module or a standard Lecture inside the Module
          // FIX: Ensure 'SubModule' remains 'SubModule' for createItem logic
          const typeForCreate = popupType === 'SubModule' ? 'SubModule' : 'Lecture';
          const newItem = createItem(title, module.content.length, typeForCreate as any, module.id);

          return {
            ...module,
            content: [...module.content, newItem as any]
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
        if (subIndex !== undefined) {
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
    if (action === 'add') {
      setCurrentModuleId(moduleId);
      setPopupType('SubModule');
      setPopup(true);
      return;
    }
    updateModuleById(moduleId, (module) => {
      if (action === 'remove' && index !== undefined) {
        return { ...module, content: module.content.filter((_, i) => i !== index) };
      }
      if (action === 'toggle' && index !== undefined) {
        const updatedContent = [...module.content];
        const subMod = { ...(updatedContent[index] as Module) };
        if ('collapsed' in subMod) subMod.collapsed = !subMod.collapsed;
        updatedContent[index] = subMod;
        return { ...module, content: updatedContent };
      }
      return module;
    });
  };

  const updateTitle = (
    type: 'module' | 'submodule' | 'lecture',
    id: string,
    newTitle: string,
    extraArgs?: { moduleId: string; subModuleIndex?: number }
  ) => {
    setModules((prev) => {
      if (type === 'module') {
        return prev.map((m) => (m.id === id ? { ...m, title: newTitle } : m));
      }
      return prev.map((m) => {
        if (extraArgs && m.id !== extraArgs.moduleId) return m;
        const updatedContent = m.content.map((item, idx) => {
          if (type === 'submodule' && item.id === id) {
            return { ...item, title: newTitle };
          }
          if (type === 'lecture' && item.id === id) {
            return { ...item, title: newTitle };
          }
          return item;
        });
        return { ...m, content: updatedContent } as Module;
      });
    });
  };

  const handleContent = (input: string, action: ModuleAction, modId?: string) => {
    if (input === 'Lecture') {
      handleLecture(action, modId);
    } else if (input === 'SubModule' && modId !== undefined) {
      handleSubModule(action, modId)
    }
  };

  const updateLectureBlocks = (lectureId: string, newBlocks: any[]) => {
    setModules((prevModules) => {
      const updateRecursive = (items: any[]): any[] => {
        return items.map((item) => {
          // If this is the lecture we are looking for
          if (item.id === lectureId) {
            return { ...item, blocks: newBlocks };
          }
          // If this is a module/sub-module, look inside its content
          if (item.content && Array.isArray(item.content)) {
            return { ...item, content: updateRecursive(item.content) };
          }
          return item;
        });
      };
      return updateRecursive(prevModules);
    });
  };



  return {
    state: { courseTitle, isPrivate, image, modules, showPopup, popupType, lectureDetails, courseDescription, courseRequirements },
    setters: { setCourseTitle, setIsPrivate, setImage, setModules, setPopup, setLectureDetails, setPopupType, setCurrentModuleId, setCourseDescription, setCourseRequirements },
    refs: { inputRef, quillRef, editorRef },
    handlers: { handleModule, handleSubModule, handleLecture, handleContent, updateTitle, updateLectureBlocks },
  };
};