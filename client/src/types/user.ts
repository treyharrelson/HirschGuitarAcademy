import type { Course } from "./course";

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin' | 'moderator';
    activeBadge?: { id: number; name: string; imageUrl: string } | null;
    earnedBadges?: Array<{ id: number; name: string; imageUrl: string }>;
}

// probably not best practice, but works
export interface UserInfo extends User {
    realName?: string;
    bio?: string;
    courses?: Course[];
    privacy: boolean;
    dateCreated: Date;
    activeBadge?: { id: number; name: string; imageUrl: string } | null;
    earnedBadges?: Array<{ id: number; name: string; imageUrl: string }>;
}