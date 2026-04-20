export interface Thread {
    id: number;
    title: string;
    authorId: number;
    isGlobalFeed: boolean;
    parentThreadId: number | null;
    createdAt: string;
    author?: {
        userName: string;
        firstName: string;
        lastName: string;
    };
}