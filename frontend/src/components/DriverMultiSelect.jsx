import { useState } from 'react';

function DriverMultiSelect({ drivers, value = [], onChange, maxSelections = 5, label = 'Select Drivers' }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDriver = (driverId) => {
    if (value.includes(driverId)) {
      onChange(value.filter(id => id !== driverId));
    } else if (value.length < maxSelections) {
      onChange([...value, driverId]);
    }
  };

  const getDriverById = (id) => drivers.find(d => d.driverId === id);

  return (
    <div className="relative">
      <label className="block text-sm text-gray-400 mb-1">{label}</label>

      {/* Selected badges */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input w-full min-h-[42px] flex flex-wrap gap-1 cursor-pointer"
      >
        {value.length === 0 ? (
          <span className="text-gray-500">Select up to {maxSelections} drivers...</span>
        ) : (
          value.map(driverId => {
            const driver = getDriverById(driverId);
            return driver ? (
              <span
                key={driverId}
                className="inline-flex items-center bg-f1-red text-white text-sm px-2 py-0.5 rounded"
              >
                {driver.code || driver.lastName}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDriver(driverId);
                  }}
                  className="ml-1 hover:text-gray-200"
                >
                  ×
                </button>
              </span>
            ) : null;
          })
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-f1-gray rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {drivers.map(driver => {
            const isSelected = value.includes(driver.driverId);
            const isDisabled = !isSelected && value.length >= maxSelections;

            return (
              <button
                key={driver.driverId}
                onClick={() => {
                  if (!isDisabled) toggleDriver(driver.driverId);
                }}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-f1-dark transition-colors ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${isSelected ? 'bg-f1-dark' : ''}`}
              >
                <div>
                  <span className="font-medium">{driver.fullName}</span>
                  <span className="text-sm text-gray-400 ml-2">{driver.team}</span>
                </div>
                {isSelected && (
                  <svg className="w-5 h-5 text-f1-red" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}

      <p className="text-xs text-gray-500 mt-1">
        {value.length}/{maxSelections} selected
      </p>
    </div>
  );
}

export default DriverMultiSelect;
