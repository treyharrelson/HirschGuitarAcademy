export interface Award {
	id: string,
	userId: string,
};

export interface Belt {
	id: string,
	userId: string,
	courseId: string,
};

export interface PracticeTime {
	id: string,
	userId: string,
	totalTime: Number,
	timeThisWeek: Number,
};