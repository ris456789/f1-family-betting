import { useState, useEffect } from 'react';
import Top10Picker from './Top10Picker';
import DriverMultiSelect from './DriverMultiSelect';

const MARGIN_BRACKETS = ['0-5s', '5-10s', '10-20s', '20-30s', '30s+'];

function PredictionForm({ drivers, initialValues = {}, onSubmit, isLocked = false }) {
  const [formData, setFormData] = useState({
    p1: '',
    p2: '',
    p3: '',
    top10: [],
    fastestLap: '',
    polePosition: '',
    dnfDrivers: [],
    safetyCar: false,
    redFlag: false,
    driverOfTheDay: '',
    winningMarginBracket: '',
    ...initialValues
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData(prev => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.p1) newErrors.p1 = 'Winner prediction is required';
    if (!formData.p2) newErrors.p2 = 'P2 prediction is required';
    if (!formData.p3) newErrors.p3 = 'P3 prediction is required';
    if (formData.top10.length !== 10) newErrors.top10 = 'Please select exactly 10 drivers';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const DriverSelect = ({ label, field, excludeIds = [] }) => {
    const availableDrivers = drivers.filter(d => !excludeIds.includes(d.driverId));

    return (
      <div>
        <label className="block text-sm text-gray-400 mb-1">{label}</label>
        <select
          value={formData[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          className={`select w-full ${errors[field] ? 'border-red-500' : ''}`}
          disabled={isLocked}
        >
          <option value="">Select driver...</option>
          {availableDrivers.map(driver => (
            <option key={driver.driverId} value={driver.driverId}>
              {driver.fullName} ({driver.team})
            </option>
          ))}
        </select>
        {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
      </div>
    );
  };

  const Toggle = ({ label, field, description }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="font-medium">{label}</span>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => handleChange(field, !formData[field])}
        disabled={isLocked}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          formData[field] ? 'bg-f1-red' : 'bg-gray-600'
        } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            formData[field] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (isLocked) {
    return (
      <div className="card text-center py-8">
        <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <h3 className="text-xl font-bold mb-2">Predictions Locked</h3>
        <p className="text-gray-400">
          Predictions are locked once qualifying begins.
          Check back after the race for results!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Podium Predictions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="text-2xl mr-2">🏆</span>
          Podium Predictions
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <DriverSelect label="Winner (P1)" field="p1" excludeIds={[formData.p2, formData.p3].filter(Boolean)} />
          <DriverSelect label="Second (P2)" field="p2" excludeIds={[formData.p1, formData.p3].filter(Boolean)} />
          <DriverSelect label="Third (P3)" field="p3" excludeIds={[formData.p1, formData.p2].filter(Boolean)} />
        </div>
      </div>

      {/* Top 10 */}
      <div className="card">
        <Top10Picker
          drivers={drivers}
          value={formData.top10}
          onChange={(value) => handleChange('top10', value)}
        />
        {errors.top10 && <p className="text-red-500 text-xs mt-2">{errors.top10}</p>}
      </div>

      {/* Special Predictions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="text-2xl mr-2">⚡</span>
          Special Predictions
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <DriverSelect label="Fastest Lap" field="fastestLap" />
          <DriverSelect label="Pole Position" field="polePosition" />
          <DriverSelect label="Driver of the Day" field="driverOfTheDay" />
          <div>
            <label className="block text-sm text-gray-400 mb-1">Winning Margin</label>
            <select
              value={formData.winningMarginBracket}
              onChange={(e) => handleChange('winningMarginBracket', e.target.value)}
              className="select w-full"
            >
              <option value="">Select bracket...</option>
              {MARGIN_BRACKETS.map(bracket => (
                <option key={bracket} value={bracket}>{bracket}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DNF Predictions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="text-2xl mr-2">💥</span>
          DNF Predictions
        </h3>
        <DriverMultiSelect
          drivers={drivers}
          value={formData.dnfDrivers}
          onChange={(value) => handleChange('dnfDrivers', value)}
          maxSelections={5}
          label="Who will retire from the race? (up to 5)"
        />
      </div>

      {/* Yes/No Predictions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="text-2xl mr-2">🚩</span>
          Race Events
        </h3>
        <div className="divide-y divide-gray-600">
          <Toggle
            label="Safety Car"
            field="safetyCar"
            description="Will there be a Safety Car or VSC?"
          />
          <Toggle
            label="Red Flag"
            field="redFlag"
            description="Will the race be red-flagged?"
          />
        </div>
      </div>

      {/* Submit */}
      <button type="submit" className="btn-primary w-full py-3 text-lg">
        Save Prediction
      </button>
    </form>
  );
}

export default PredictionForm;
