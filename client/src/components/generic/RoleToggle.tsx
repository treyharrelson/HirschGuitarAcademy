import React from 'react';

type Role = 'student' | 'instructor' | 'moderator';

interface RoleToggleProps {
    value: Role;
    onChange: (v: Role) => void;
    disabled?: boolean;
}

const OPTIONS: Role[] = ['student', 'instructor', 'moderator'];

const COLORS: Record<Role, { active: string; inactive: string }> = {
    student: { active: 'bg-gray-500 text-white', inactive: 'text-gray-500 hover:bg-gray-100' },
    instructor: { active: 'bg-blue-500 text-white', inactive: 'text-blue-600 hover:bg-blue-50' },
    moderator: { active: 'bg-amber-500 text-white', inactive: 'text-amber-600 hover:bg-amber-50' },
};

const LABELS: Record<Role, string> = {
    student: 'Student',
    instructor: 'Teacher',
    moderator: 'Moderator',
};

const RoleToggle: React.FC<RoleToggleProps> = ({ value, onChange, disabled = false }) => {
    return (
        <div className="flex bg-gray-50/50 p-1 rounded-full border border-gray-100 shadow-inner">
            {OPTIONS.map((option, i) => {
                const isActive = value === option;
                const { active, inactive } = COLORS[option];
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => !isActive && onChange(option)}
                        disabled={disabled}
                        title={`Set as ${LABELS[option]}`}
                        className={[
                            'px-4 py-1.5 text-[11px] font-bold transition-all uppercase tracking-wider',
                            i === 0 ? 'rounded-l-full' : '',
                            i === OPTIONS.length - 1 ? 'rounded-r-full' : '',
                            isActive 
                                ? `${active} shadow-sm transform scale-105 z-10` 
                                : `${inactive} hover:scale-105`,
                            disabled ? 'opacity-50 cursor-not-allowed' : isActive ? 'cursor-default' : 'cursor-pointer',
                        ].join(' ')}
                    >
                        {LABELS[option]}
                    </button>
                );
            })}
        </div>
    );
};

export default RoleToggle;
