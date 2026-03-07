import { useState } from 'react';
import { Link } from 'react-router-dom';
import { drivers2025, getDriverByCode } from '../data/drivers2025';
import { mockRaceResults, mockRaceInfo, calculateMockScore, getScoreRating } from '../data/mockRaceData';
import MockResultsView from '../components/MockResultsView';

const MARGIN_BRACKETS = ['Under 5s', 'Over 5s'];

function MockTrial() {
  const [step, setStep] = useState('welcome'); // welcome, predict, results
  const [prediction, setPrediction] = useState({
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
    winningMarginUnder5s: true
  });
  const [results, setResults] = useState(null);

  const handleSubmit = () => {
    const scoreResult = calculateMockScore(prediction, mockRaceResults);
    setResults(scoreResult);
    setStep('results');
  };

  const handleReset = () => {
    setPrediction({
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
      winningMarginUnder5s: true
    });
    setResults(null);
    setStep('welcome');
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Mock Trial Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-center py-2 px-4 rounded-t-lg font-bold">
          🧪 MOCK TRIAL MODE
        </div>

        <div className="card rounded-t-none text-center py-12">
          <div className="text-6xl mb-6">🏁</div>
          <h1 className="text-3xl font-bold mb-4">Practice Your Predictions</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Practice with the 2025 Australian Grand Prix!
            Your predictions won't be saved - this is just for fun.
          </p>

          {/* Race Card */}
          <div className="bg-f1-dark rounded-lg p-6 mb-8 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">🇦🇺</span>
              <div className="text-right">
                <p className="text-f1-red font-semibold">Round 1</p>
                <p className="text-sm text-gray-400">March 16, 2025</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Australian Grand Prix</h2>
            <p className="text-gray-400">Albert Park Circuit • Melbourne</p>
            <img
              src={mockRaceResults.circuitImage}
              alt="Albert Park Circuit"
              className="mt-4 mx-auto h-32 opacity-50"
            />
          </div>

          <button
            onClick={() => setStep('predict')}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105"
          >
            Start Predicting →
          </button>

          <p className="text-sm text-gray-500 mt-6">
            See how you would have scored against the actual results!
          </p>
        </div>
      </div>
    );
  }

  // Results Screen
  if (step === 'results' && results) {
    return (
      <MockResultsView
        results={results}
        prediction={prediction}
        actual={mockRaceResults}
        onTryAgain={() => setStep('predict')}
        onBackHome={handleReset}
      />
    );
  }

  // Prediction Form
  return (
    <div className="max-w-3xl mx-auto">
      {/* Mock Trial Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-center py-2 px-4 rounded-t-lg font-bold flex items-center justify-center gap-2">
        <span>🧪</span>
        <span>MOCK TRIAL MODE</span>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Not Saved</span>
      </div>

      <div className="card rounded-t-none">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Make Your Predictions</h1>
            <p className="text-gray-400">2025 Australian Grand Prix</p>
          </div>
          <span className="text-4xl">🇦🇺</span>
        </div>

        <div className="space-y-6">
          {/* Podium Predictions */}
          <div className="bg-f1-dark rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Podium Predictions
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <DriverSelect
                label="Winner (P1)"
                value={prediction.p1}
                onChange={(v) => setPrediction(p => ({ ...p, p1: v }))}
                exclude={[prediction.p2, prediction.p3]}
              />
              <DriverSelect
                label="Second (P2)"
                value={prediction.p2}
                onChange={(v) => setPrediction(p => ({ ...p, p2: v }))}
                exclude={[prediction.p1, prediction.p3]}
              />
              <DriverSelect
                label="Third (P3)"
                value={prediction.p3}
                onChange={(v) => setPrediction(p => ({ ...p, p3: v }))}
                exclude={[prediction.p1, prediction.p2]}
              />
            </div>
          </div>

          {/* Top 10 */}
          <div className="bg-f1-dark rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔟</span>
              Top 10 Prediction
              <span className="text-sm text-gray-400 ml-auto">{prediction.top10.length}/10</span>
            </h3>
            <Top10Selector
              value={prediction.top10}
              onChange={(v) => setPrediction(p => ({ ...p, top10: v }))}
            />
          </div>

          {/* Special Predictions */}
          <div className="bg-f1-dark rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Special Predictions
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <DriverSelect
                label="Pole Position"
                value={prediction.polePosition}
                onChange={(v) => setPrediction(p => ({ ...p, polePosition: v }))}
              />
              <DriverSelect
                label="Fastest Lap"
                value={prediction.fastestLap}
                onChange={(v) => setPrediction(p => ({ ...p, fastestLap: v }))}
              />
              <DriverSelect
                label="Driver of the Day"
                value={prediction.driverOfTheDay}
                onChange={(v) => setPrediction(p => ({ ...p, driverOfTheDay: v }))}
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1">Winning Margin</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrediction(p => ({ ...p, winningMarginUnder5s: true }))}
                    className={`flex-1 py-2 px-4 rounded font-semibold transition-colors ${
                      prediction.winningMarginUnder5s
                        ? 'bg-amber-500 text-white'
                        : 'bg-f1-gray text-gray-400'
                    }`}
                  >
                    Under 5s
                  </button>
                  <button
                    onClick={() => setPrediction(p => ({ ...p, winningMarginUnder5s: false }))}
                    className={`flex-1 py-2 px-4 rounded font-semibold transition-colors ${
                      !prediction.winningMarginUnder5s
                        ? 'bg-amber-500 text-white'
                        : 'bg-f1-gray text-gray-400'
                    }`}
                  >
                    Over 5s
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DNF Predictions */}
          <div className="bg-f1-dark rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">💥</span>
              DNF Predictions
              <span className="text-sm text-gray-400 ml-auto">{prediction.dnfDrivers.length}/5</span>
            </h3>
            <DNFSelector
              value={prediction.dnfDrivers}
              onChange={(v) => setPrediction(p => ({ ...p, dnfDrivers: v }))}
              maxSelections={5}
            />
          </div>

          {/* Race Events */}
          <div className="bg-f1-dark rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🚩</span>
              Race Events
            </h3>
            <div className="space-y-4">
              <Toggle
                label="Safety Car"
                description="Will there be a Safety Car or VSC?"
                value={prediction.safetyCar}
                onChange={(v) => setPrediction(p => ({ ...p, safetyCar: v }))}
              />
              <Toggle
                label="Red Flag"
                description="Will the race be red-flagged?"
                value={prediction.redFlag}
                onChange={(v) => setPrediction(p => ({ ...p, redFlag: v }))}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="btn-secondary flex-1"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg flex-1 transition-all"
            >
              See My Score →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Driver Select with Headshot
function DriverSelect({ label, value, onChange, exclude = [] }) {
  const selectedDriver = value ? getDriverByCode(value) : null;
  const availableDrivers = drivers2025.filter(d => !exclude.includes(d.code));

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="select w-full pl-12 appearance-none"
        >
          <option value="">Select driver...</option>
          {availableDrivers.map(driver => (
            <option key={driver.code} value={driver.code}>
              {driver.name} ({driver.team})
            </option>
          ))}
        </select>
        {selectedDriver && (
          <img
            src={selectedDriver.headshot}
            alt={selectedDriver.name}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full object-cover"
            style={{ backgroundColor: selectedDriver.teamColor }}
          />
        )}
      </div>
    </div>
  );
}

// Top 10 Selector
function Top10Selector({ value, onChange }) {
  const addDriver = (code) => {
    if (value.length >= 10 || value.includes(code)) return;
    onChange([...value, code]);
  };

  const removeDriver = (code) => {
    onChange(value.filter(c => c !== code));
  };

  const moveDriver = (index, direction) => {
    const newValue = [...value];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newValue.length) return;
    [newValue[index], newValue[newIndex]] = [newValue[newIndex], newValue[index]];
    onChange(newValue);
  };

  const availableDrivers = drivers2025.filter(d => !value.includes(d.code));

  return (
    <div className="space-y-3">
      {/* Selected drivers */}
      <div className="space-y-2">
        {value.map((code, index) => {
          const driver = getDriverByCode(code);
          return (
            <div
              key={code}
              className="flex items-center gap-3 bg-f1-gray rounded-lg p-2"
            >
              <span
                className="w-8 h-8 flex items-center justify-center rounded font-bold text-sm"
                style={{ backgroundColor: driver?.teamColor }}
              >
                P{index + 1}
              </span>
              <img
                src={driver?.headshot}
                alt={driver?.name}
                className="w-10 h-10 rounded-full object-cover"
                style={{ backgroundColor: driver?.teamColor }}
              />
              <div className="flex-1">
                <p className="font-medium">{driver?.name}</p>
                <p className="text-xs text-gray-400">{driver?.team}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => moveDriver(index, -1)}
                  disabled={index === 0}
                  className="p-1 hover:bg-f1-dark rounded disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDriver(index, 1)}
                  disabled={index === value.length - 1}
                  className="p-1 hover:bg-f1-dark rounded disabled:opacity-30"
                >
                  ▼
                </button>
                <button
                  onClick={() => removeDriver(code)}
                  className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add driver dropdown */}
      {value.length < 10 && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              addDriver(e.target.value);
              e.target.value = '';
            }
          }}
          className="select w-full"
          value=""
        >
          <option value="">+ Add driver to position {value.length + 1}...</option>
          {availableDrivers.map(driver => (
            <option key={driver.code} value={driver.code}>
              {driver.name} ({driver.team})
            </option>
          ))}
        </select>
      )}

      {/* Quick fill button */}
      {value.length === 0 && (
        <button
          onClick={() => onChange(drivers2025.slice(0, 10).map(d => d.code))}
          className="text-sm text-amber-500 hover:text-amber-400"
        >
          Auto-fill with grid order →
        </button>
      )}
    </div>
  );
}

// DNF Selector
function DNFSelector({ value, onChange, maxSelections }) {
  const toggleDriver = (code) => {
    if (value.includes(code)) {
      onChange(value.filter(c => c !== code));
    } else if (value.length < maxSelections) {
      onChange([...value, code]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {drivers2025.map(driver => {
        const isSelected = value.includes(driver.code);
        return (
          <button
            key={driver.code}
            onClick={() => toggleDriver(driver.code)}
            disabled={!isSelected && value.length >= maxSelections}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'ring-2 ring-amber-500'
                : 'opacity-70 hover:opacity-100'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            style={{ backgroundColor: isSelected ? driver.teamColor + '40' : driver.teamColor + '20' }}
          >
            <img
              src={driver.headshot}
              alt={driver.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span>{driver.code}</span>
            {isSelected && <span className="text-amber-500">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

// Toggle Switch
function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="font-medium">{label}</span>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
          value ? 'bg-amber-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
        <span className={`absolute text-xs font-bold ${value ? 'left-2' : 'right-2'}`}>
          {value ? 'YES' : 'NO'}
        </span>
      </button>
    </div>
  );
}

export default MockTrial;
