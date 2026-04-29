import type { Course } from "./course";

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin' | 'moderator';
    
}

// probably not best practice, but works
export interface UserInfo extends User {
    bio?: string;
    courses?: Course[];
    privacy: boolean;
}