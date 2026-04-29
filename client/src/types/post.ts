export interface Attachment {
    fileKey: string;
    fileType: string;
    fileName: string;
}

export interface Post {
    id: number;
    threadId: number | null;
    userId: number;
    content: string;
    scope: 'thread' | 'global';
    announcedThreadId?: number | null;
    createdAt: string;
    author?: {
        userName: string;
        firstName: string;
        lastName: string;
    };
    attachments?: Attachment[];
    thread?: {
        id: number;
        title: string;
    };
    announcedThread?: {
        id: number;
        title: string;
        visibility: 'public' | 'global' | 'private';
    };
}
