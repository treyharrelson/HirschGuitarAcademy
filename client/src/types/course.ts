export interface Lecture {
    id: number,
    title: string,
    order: number,
    content: string,
    module_Id: number
}

export interface Module {
    id: number,
    title: string,
    order: number,
    courseId: number
    collapsed: boolean,
    content: any[]
}

export interface CourseInstructor {
    id: number,
    userName: string,
    firstName: string,
    lastName: string,
    email: string
}
export interface Course {
    id: number,
    name: string,
    instructorId: number,
    instructor?: CourseInstructor,
    enrolled: number,
    isPrivate: boolean,
    thumbnail: File
}