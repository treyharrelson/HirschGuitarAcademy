import type { Course } from "./course";

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin' | 'moderator';
    
}

export interface TempUser extends User {
    emailConfirmed: boolean;
    adminConfirmed: boolean;
}

// probably not best practice, but works
export interface UserInfo extends User {
    realName?: string;
    bio?: string;
    courses?: Course[];
    privacy: boolean;
    dateCreated: Date;
}