export interface Lecture {
    id: string,
    title: string,
    order: number,
    content: string,
    module_Id: string
}

export interface Module {
    id: string,
    title: string,
    order: number,
    courseId: string,
    collapsed: boolean,
    content: (Module | Lecture)[]
}

export interface CourseInstructor {
    id: string,
    userName: string,
    firstName: string,
    lastName: string,
    email: string
}
export interface Course {
    id: string,
    name: string,
    instructorId: number,
    instructor?: CourseInstructor,
    enrolled: number,
    completed?: boolean,
    isPrivate: boolean,
    thumbnail: File | string,
    requirements?: { id: string | number; name: string }[]
}