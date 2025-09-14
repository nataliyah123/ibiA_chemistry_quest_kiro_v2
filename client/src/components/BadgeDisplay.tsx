import React, { useState } from 'react';
import { Badge, RARITY_COLORS, RARITY_LABELS } from '../types/character';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'medium',
  showTooltip = true
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const rarityColor = RARITY_COLORS[badge.rarity];
  const rarityLabel = RARITY_LABELS[badge.rarity];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center bg-white`}
        style={{ borderColor: rarityColor }}
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => showTooltip && setShowDetails(false)}
        onClick={() => setShowDetails(!showDetails)}
      >
        {badge.iconUrl ? (
          <img
            src={badge.iconUrl}
            alt={badge.name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div
            className="w-full h-full rounded-md flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: rarityColor }}
          >
            <span className={textSizeClasses[size]}>
              {badge.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Rarity indicator */}
      <div
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
        style={{ backgroundColor: rarityColor }}
        title={rarityLabel}
      />

      {/* Tooltip */}
      {showDetails && showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3">
          <div className="font-bold text-center mb-2">{badge.name}</div>
          <div className="text-gray-300 text-xs mb-2">{badge.description}</div>
          <div className="flex justify-between items-center text-xs">
            <span
              className="px-2 py-1 rounded text-white font-medium"
              style={{ backgroundColor: rarityColor }}
            >
              {rarityLabel}
            </span>
            <span className="text-gray-400">
              Earned {formatDate(badge.earnedAt)}
            </span>
          </div>
          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          />
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;