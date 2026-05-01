import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashButton } from './Buttons';

type SidebarProps = {
    children?: React.ReactNode;
    title?: string;
};

export default function Sidebar({ children, title = "Navigation" }: SidebarProps) {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    return (
        <div className="w-full lg:w-72 flex-shrink-0">

            {/* Navigation / Custom Content */}
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky ">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
                </div>
                <ul className="flex flex-col p-2 gap-1 bg-white">
                    {children}
                </ul>
            </nav>
        </div>
    );
}

export function SidebarLink({
    icon,
    label,
    isActive,
    node,
    onClick
}: {
    icon?: React.ReactNode;
    label?: string;
    isActive?: boolean;
    node?: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <li>
            {
                node == null ?
                <button
                    onClick={onClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group cursor-pointer ${isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                        }`}
                >
                    {icon && (
                        <span className={`transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                            {icon}
                        </span>
                    )}
                    {label}
                </button>
                :
                node
            }
        </li>
    );
}
