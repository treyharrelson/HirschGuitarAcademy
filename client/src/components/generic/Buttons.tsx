import React from 'react'

type ButtonProps = {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}

export const BigBlueButton = ({ children, onClick, disabled }: ButtonProps) => (
	<button
		onClick={disabled ? undefined : onClick}
		disabled={disabled}
		className={`px-4 py-1 rounded-full transition-all text-white ${
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
)