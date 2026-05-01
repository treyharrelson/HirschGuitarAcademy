import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';

interface UserBadgeProps {
  badgeKey: string | null;
  badgeName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserBadge: React.FC<UserBadgeProps> = ({ badgeKey, badgeName, size = 'md' }) => {
  const [url, setUrl] = useState<string>('');

  // Map size prop to Tailwind classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };

  useEffect(() => {
    if (badgeKey) {
      // Logic to resolve R2 key to a viewable URL
      api.get('/api/upload/file-url', { params: { fileKey: badgeKey } })
        .then(res => setUrl(res.data.presignedUrl))
        .catch(() => setUrl(''));
    }
  }, [badgeKey]);

  if (!url) return null;

  return (
    <div className="relative group inline-block">
      <img 
        src={url} 
        alt={badgeName || "Badge"} 
        className={`${sizeClasses[size]} object-contain rounded-full`}
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.15))' }}/>
      {/* Simple Tooltip on Hover */}
      {badgeName && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {badgeName}
        </div>
      )}
    </div>
  );
};

export default UserBadge;