import type { User } from "./user";
import type { Course } from "./course";

export interface Award {
	id: string,
	user?: User,
};

export interface Belt {
	id: string,
	user?: User,
	course?: Course,
};

export interface PracticeTime {
	id: string,
	user?: User,
	totalTime: Number,
	timeThisWeek: Number,
};