type Visibility = 'public' | 'global' | 'private';

interface VisibilityToggleProps {
    value: Visibility;
    onChange: (v: Visibility) => void;
    disabled?: boolean;
}

const OPTIONS: Visibility[] = ['public', 'global', 'private'];

const COLORS: Record<Visibility, { active: string; inactive: string }> = {
    public:  { active: 'bg-gray-500 text-white',  inactive: 'text-gray-500 hover:bg-gray-100' },
    global:  { active: 'bg-blue-500 text-white',  inactive: 'text-blue-600 hover:bg-blue-50' },
    private: { active: 'bg-amber-500 text-white', inactive: 'text-amber-600 hover:bg-amber-50' },
};

const LABELS: Record<Visibility, string> = {
    public: 'Public',
    global: 'Global',
    private: 'Private',
};

function VisibilityToggle({ value, onChange, disabled = false}: VisibilityToggleProps) {
    return (
        <div className="flex">
            {OPTIONS.map((option, i) => {
                const isActive = value === option;
                const { active, inactive } = COLORS[option];
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => !isActive && onChange(option)}
                        disabled={disabled || isActive}
                        title={`Set to ${option}`}
                        className={[
                            'px-3 py-1 text-xs font-semibold transition-colors border border-gray-200',
                            i === 0 ? 'rounded-l-full' : '',
                            i === OPTIONS.length - 1 ? 'rounded-r-full' : '',
                            i > 0 ? '-ml-px' : '',
                            isActive ? active : inactive,
                            disabled ? 'opacity-50 cursor-not-allowed' : isActive ? 'cursor-default' : 'cursor-pointer',
                        ].join(' ')}
                    >
                        {LABELS[option]}
                    </button>
                );
            })}
        </div>
    );
}


export default VisibilityToggle;