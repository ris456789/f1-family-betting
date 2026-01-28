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
      className={`flex items-center bg-f1-dark rounded p-2 mb-2 ${
        isDragging ? 'opacity-50 ring-2 ring-f1-red' : ''
      }`}
    >
      <span className="w-8 h-8 flex items-center justify-center bg-f1-gray rounded mr-3 font-bold text-f1-red">
        {position}
      </span>
      <div
        {...attributes}
        {...listeners}
        className="flex-1 flex items-center cursor-grab active:cursor-grabbing"
      >
        <svg className="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
        <span>{driver.fullName}</span>
        <span className="ml-2 text-xs text-gray-500">{driver.team}</span>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {driver.fullName} ({driver.team})
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
