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
            {/* Welcome Card */}
            <button 
                onClick={() => navigate("/profile")}
                className="w-full text-left cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 hover:bg-gray-200 transition-colors duration-200 block"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl shadow-inner">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400 mb-1">Welcome back,</p>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1 truncate">{user.name}</h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize border border-blue-100">
                            {user.role}
                        </span>
                    </div>
                </div>
            </button>

            {/* Navigation / Custom Content */}
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-34">
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
