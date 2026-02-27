export interface Post {
    id: number,
    threadId: number;
    userId: number;
    content: string;
    datePosted: string;
    author?: {
        userName: string;
        firstName: string;
        lastName: string;
    }
}