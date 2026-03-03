export interface Attachment {
    fileKey: string;
    fileType: string;
    fileName: string;
}

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
    };
    attachments?: Attachment[];
}