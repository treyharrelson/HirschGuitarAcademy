export interface Thread {
    id: number;
    title: string;
    authorId: number;
    visibility: 'public' | 'global' | 'private';
    parentThreadId: number | null;
    createdAt: string;
    author?: {
        userName: string;
        firstName: string;
        lastName: string;
    };
}