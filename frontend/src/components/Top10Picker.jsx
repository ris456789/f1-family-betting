import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const POSITION_LABELS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function SortableItem({ id, driver, position, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center bg-f1-dark rounded-lg p-2 mb-2 border border-transparent ${
        isDragging ? 'opacity-50 ring-2 ring-f1-red border-f1-red' : ''
      }`}
    >
      {/* Position badge */}
      <span
        className="w-8 h-8 flex items-center justify-center rounded mr-2 font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: position <= 3 ? driver?.teamColor + '33' : '#38383F', color: position <= 3 ? driver?.teamColor : '#e10600' }}
      >
        {POSITION_LABELS[position] || `P${position}`}
      </span>

      {/* Drag handle + driver info */}
      <div
        {...attributes}
        {...listeners}
        className="flex-1 flex items-center gap-2 cursor-grab active:cursor-grabbing min-w-0"
      >
        {/* Headshot */}
        <div
          className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2"
          style={{ borderColor: driver?.teamColor || '#888', backgroundColor: driver?.teamColor + '22' }}
        >
          <img
            src={driver?.headshot}
            alt={driver?.fullName}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:0.7rem;font-weight:bold;color:white">${driver?.code || '?'}</span>`;
            }}
          />
        </div>
        {/* Name + team */}
        <div className="min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{driver?.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{driver?.team}</p>
        </div>
      </div>

      <button
        onClick={() => onRemove(id)}
        className="p-1 text-gray-500 hover:text-red-500 transition-colors ml-1 flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function Top10Picker({ drivers, value = [], onChange }) {
  const [selectedDrivers, setSelectedDrivers] = useState(value);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const availableDrivers = drivers.filter(
    d => !selectedDrivers.includes(d.driverId)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = selectedDrivers.indexOf(active.id);
      const newIndex = selectedDrivers.indexOf(over.id);
      const newOrder = arrayMove(selectedDrivers, oldIndex, newIndex);
      setSelectedDrivers(newOrder);
      onChange(newOrder);
    }
  };

  const addDriver = (driverId) => {
    if (selectedDrivers.length >= 10) return;
    const newSelection = [...selectedDrivers, driverId];
    setSelectedDrivers(newSelection);
    onChange(newSelection);
  };

  const removeDriver = (driverId) => {
    const newSelection = selectedDrivers.filter(id => id !== driverId);
    setSelectedDrivers(newSelection);
    onChange(newSelection);
  };

  const getDriverById = (id) => drivers.find(d => d.driverId === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Top 10 Prediction</h3>
        <span className="text-sm text-gray-400">
          {selectedDrivers.length}/10 selected
        </span>
      </div>

      {/* Selected drivers (draggable) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={selectedDrivers}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[100px] bg-f1-gray rounded-lg p-3">
            {selectedDrivers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Select drivers below to build your top 10
              </p>
            ) : (
              selectedDrivers.map((driverId, index) => {
                const driver = getDriverById(driverId);
                return driver ? (
                  <SortableItem
                    key={driverId}
                    id={driverId}
                    driver={driver}
                    position={index + 1}
                    onRemove={removeDriver}
                  />
                ) : null;
              })
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Available drivers */}
      {selectedDrivers.length < 10 && (
        <div>
          <p className="text-sm text-gray-400 mb-2">Add driver:</p>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addDriver(e.target.value);
                e.target.value = '';
              }
            }}
            className="select w-full"
            defaultValue=""
          >
            <option value="">Select a driver...</option>
            {availableDrivers.map(driver => (
              <option key={driver.driverId} value={driver.driverId}>
                #{driver.number} {driver.fullName} — {driver.team}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quick fill based on current standings */}
      {selectedDrivers.length === 0 && (
        <button
          onClick={() => {
            const top10 = drivers.slice(0, 10).map(d => d.driverId);
            setSelectedDrivers(top10);
            onChange(top10);
          }}
          className="btn-secondary w-full text-sm"
        >
          Auto-fill from Current Standings
        </button>
      )}
    </div>
  );
}

export default Top10Picker;
