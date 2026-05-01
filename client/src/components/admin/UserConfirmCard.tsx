import React from 'react';
import type { TempUser } from '../../types/user';

interface UserConfirmCardProps {
    user: TempUser;
    onConfirm: (user: TempUser) => void;
    onDeny: (user: TempUser) => void;
    isProcessing?: boolean;
}

const UserConfirmCard: React.FC<UserConfirmCardProps> = ({ user, onConfirm, onDeny, isProcessing }) => {
    return (
        <div className="grid grid-cols-[1fr_auto] gap-4 items-center bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm transition-all hover:border-blue-200">
            {/* User Info */}
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800 truncate text-sm">
                        {user.name}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
                        {user.role}
                    </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                    {user.email}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {(user.adminConfirmed && !user.emailConfirmed) ?
                    <div>
                        <p>Waiting for email validation.</p>
                        <button
                            onClick={() => onDeny(user)}
                            disabled={isProcessing}
                            className="text-xs bg-white border border-red-100 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Deny
                        </button>
                    </div>
                    :
                    <div>
                        <button
                            onClick={() => onConfirm(user)}
                            disabled={isProcessing}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => onDeny(user)}
                            disabled={isProcessing}
                            className="text-xs bg-white border border-red-100 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Deny
                        </button>
                    </div>}

            </div>
        </div>
    );
};

export default UserConfirmCard;
