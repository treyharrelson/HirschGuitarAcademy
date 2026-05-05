import React, { useState } from 'react';
import type { TempUser } from '../../types/user';
import RoleToggle from '../generic/RoleToggle';

interface UserConfirmCardProps {
    user: TempUser;
    onConfirm: (user: TempUser, selectedRole: 'student' | 'instructor' | 'moderator') => void;
    onDeny: (user: TempUser) => void;
    isProcessing?: boolean;
}

const UserConfirmCard: React.FC<UserConfirmCardProps> = ({ user, onConfirm, onDeny, isProcessing }) => {
    const [selectedRole, setSelectedRole] = useState<'student' | 'instructor' | 'moderator'>(
        (user.role as any) === 'admin' ? 'student' : (user.role as any) || 'student'
    );

    return (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md group">
            {/* User Info */}
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-800 truncate text-base">
                        {user.name}
                    </span>
                </div>
                <p className="text-xs text-gray-400 font-medium">
                    {user.email}
                </p>
            </div>

            {/* Role Toggle - Centered in the middle column */}
            <div className="flex justify-center">
                <RoleToggle 
                    value={selectedRole} 
                    onChange={setSelectedRole} 
                    disabled={isProcessing} 
                />
            </div>

            {/* Actions - Pushed to the far right of the last column */}
            <div className="flex items-center gap-2 justify-end">
                {(user.adminConfirmed && !user.emailConfirmed) ?
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter bg-amber-50 px-2 py-0.5 rounded-full">
                            Waiting for email
                        </span>
                        <button
                            onClick={() => onDeny(user)}
                            disabled={isProcessing}
                            className="text-[11px] bg-white border border-red-100 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Deny
                        </button>
                    </div>
                    :
                    <>
                        <button
                            onClick={() => onConfirm(user, selectedRole)}
                            disabled={isProcessing}
                            className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => onDeny(user)}
                            disabled={isProcessing}
                            className="text-[11px] bg-white border border-red-100 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Deny
                        </button>
                    </>
                }
            </div>
        </div>
    );
};

export default UserConfirmCard;
