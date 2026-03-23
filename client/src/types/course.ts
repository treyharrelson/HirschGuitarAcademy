export interface Lecture {
    id: string,
    title: string,
    order: number,
    content: string,
    module_Id: string
}

export interface SubModule {
    id: string,
    title: string,
    order: number,
    //courseId: number,
    collapsed: boolean,
    content: Lecture[]
}

export interface Module {
    id: string,
    title: string,
    order: number,
    courseId: string,
    collapsed: boolean,
    content: (SubModule | Lecture)[]
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
    isPrivate: boolean,
    thumbnail: File | string
}