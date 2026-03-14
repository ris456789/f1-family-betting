import { useState } from 'react';
import { getTeamColor, getDriverByCode, getAllDrivers } from '../data/drivers2026';

function DriverAvatar({ driver, size = 'md', showName = false, showTeam = false }) {
  const [imageError, setImageError] = useState(false);

  // Handle both driver object and driver code string
  // Try by 3-letter code first, then fall back to driverId
  const driverData = typeof driver === 'string'
    ? getDriverByCode(driver) || getAllDrivers().find(d => d.driverId === driver)
    : driver;

  if (!driverData) {
    return (
      <div className={`flex items-center ${showName ? 'space-x-2' : ''}`}>
        <div
          className={`rounded-full bg-gray-600 flex items-center justify-center text-white font-bold ${
            size === 'sm' ? 'w-6 h-6 text-xs' :
            size === 'md' ? 'w-8 h-8 text-sm' :
            size === 'lg' ? 'w-12 h-12 text-base' :
            'w-16 h-16 text-lg'
          }`}
        >
          ?
        </div>
      </div>
    );
  }

  const teamColor = driverData.teamColor || getTeamColor(driverData.teamId);
  const hasHeadshot = (driverData.headshot || driverData.headshotUrl) && !imageError;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  return (
    <div className={`flex items-center ${showName ? 'space-x-2' : ''}`}>
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center font-bold ${sizeClasses[size]}`}
        style={{ backgroundColor: teamColor }}
      >
        {hasHeadshot ? (
          <img
            src={driverData.headshot || driverData.headshotUrl}
            alt={driverData.name || driverData.fullName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {driverData.code || driverData.name?.substring(0, 3).toUpperCase()}
          </span>
        )}
      </div>

      {(showName || showTeam) && (
        <div className="flex flex-col">
          {showName && (
            <span className="font-medium">
              {driverData.name || driverData.fullName}
            </span>
          )}
          {showTeam && (
            <span className="text-xs text-gray-400">
              {driverData.team}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DriverAvatar;
