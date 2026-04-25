import React, { Children } from 'react'

type ButtonProps = {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	extra?: any;
}

export const BigBlueButton = ({ children, onClick, disabled }: ButtonProps) => (
	<button
		onClick={disabled ? undefined : onClick}
		disabled={disabled}
		className={`px-5 py-2 rounded-full transition-all text-white ${
			disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
		}`}
	>
		{children}
	</button>
);

export const NavBarButton = ({ children, onClick }: ButtonProps) => (
	<button
		onClick={onClick}
		className='flex text-gray-500 gap-8 hover:text-blue-600'
	>
		{children}
	</button>
);

export const DashButton = ({ children, onClick }: ButtonProps) => (
	<button
		onClick={onClick}
		className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-all'
	>
		{children}
	</button>
);

export const InstructorCourseButton = ({children, onClick, extra}: ButtonProps) => (
	<button
		onClick={onClick}
		className={`text-left p-3 rounded-lg border transition-all ${String(extra.selectedCourseId) === String(extra.courseid) ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}
		>
			{children}
		</button>
);