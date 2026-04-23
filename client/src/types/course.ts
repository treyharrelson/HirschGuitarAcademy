export type BlockType = 'text' | 'image' | 'video';
export interface BaseBlock {
    id: string;
    type: BlockType;
    order: number;
}

export interface TextBlock extends BaseBlock {
    type: 'text';
    content: string;
}

export interface MediaBlock extends BaseBlock {
    type: 'image' | 'video';
    url: string;
    filename?: string;
}

export type ContentBlock = TextBlock | MediaBlock;

export interface Lecture {
    id: string;
    title: string;
    order: number;
    module_Id: string;
    blocks: ContentBlock[];
}

export interface Module {
    id: string;
    title: string;
    order: number;
    courseId: string;
    content: (Module | Lecture)[];
}

export interface CourseInstructor {
    id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
}
export interface Course {
    id: string;
    name: string;
    instructorId: number;
    instructor?: CourseInstructor;
    enrolled: number;
    completed?: boolean;
    isPrivate: boolean;
    thumbnail: string | null;
    requirements?: { id: string | number; name: string }[];
}