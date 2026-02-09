export interface Thread {
    id: number;
    title: string;
    authorId: number;
    createdAt: string;
    author?: {
        userName: string;
        firstName: string;
        lastName: string;
    };
}