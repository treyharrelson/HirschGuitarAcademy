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

export interface Course {
    id: number,
    name: string,
    instructorId: number,
    enrolled: number,
    isPrivate: boolean,
    thumbnail: File
}