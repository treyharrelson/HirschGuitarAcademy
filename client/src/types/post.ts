export interface Post {
    id: number,
    threadId: number;
    userId: number;
    content: string;
    createdAt: string;
    author?: {
        userName: string;
        firstName: string;
        lastName: string;
    }
}