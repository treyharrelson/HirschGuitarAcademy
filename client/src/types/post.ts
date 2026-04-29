import type { User } from "./user";
import type { Thread } from "./thread";

export interface Attachment {
    fileKey: string;
    fileType: string;
    fileName: string;
}

export interface Post {
    id: number;
    content: string;
    scope: 'thread' | 'global';
    createdAt: string;
    author?: User;
    attachments?: Attachment[];
    thread?: Thread;
    announcedThread?: Thread;
}
