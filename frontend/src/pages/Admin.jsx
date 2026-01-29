import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import {
  getRaces,
  getDrivers,
  getRaceResult,
  fetchRaceResultsFromAPI,
  updateRaceResultManualData,
  calculateAndSaveScores
} from '../lib/api';

function Admin() {
  const { currentUser, isHost } = useUser();
  const [races, setRaces] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [raceResult, setRaceResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [manualInputs, setManualInputs] = useState({
    safetyCar: false,
    redFlag: false,
    driverOfTheDay: ''
  });

  useEffect(() => {
    fetchRaces();
  }, []);

  useEffect(() => {
    if (selectedRace) {
      fetchRaceResult(selectedRace);
    }
  }, [selectedRace]);

  const fetchRaces = async () => {
    try {
      // Get races from local data
      const raceData = getRaces(2026);
      // Sort by date descending to show most recent first
      const sortedRaces = [...raceData].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      setRaces(sortedRaces);

      // Get drivers for dropdown
      const driverData = getDrivers();
      setDrivers(driverData);
    } catch (error) {
      console.error('Error fetching races:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaceResult = async (race) => {
    const raceId = `${new Date(race.date).getFullYear()}_${race.round}`;
    try {
      const result = await getRaceResult(raceId);
      setRaceResult(result);
      if (result) {
        setManualInputs({
          safetyCar: result.safety_car || false,
          redFlag: result.red_flag || false,
          driverOfTheDay: result.driver_of_the_day || ''
        });
      } else {
        setManualInputs({ safetyCar: false, redFlag: false, driverOfTheDay: '' });
      }
    } catch (error) {
      setRaceResult(null);
      setManualInputs({ safetyCar: false, redFlag: false, driverOfTheDay: '' });
    }
  };

  const fetchResults = async () => {
    if (!selectedRace) return;

    setActionLoading(true);
    setMessage(null);

    const year = new Date(selectedRace.date).getFullYear();

    try {
      const result = await fetchRaceResultsFromAPI(year, selectedRace.round, selectedRace.raceName);
      setRaceResult(result);
      setMessage({ type: 'success', text: 'Race result record created! Fill in the details below.' });
    } catch (error) {
      console.error('Error fetching results:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to fetch results'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateManualData = async () => {
    if (!selectedRace || !raceResult) return;

    setActionLoading(true);
    setMessage(null);

    const raceId = `${new Date(selectedRace.date).getFullYear()}_${selectedRace.round}`;

    try {
      await updateRaceResultManualData(raceId, {
        safety_car: manualInputs.safetyCar,
        red_flag: manualInputs.redFlag,
        driver_of_the_day: manualInputs.driverOfTheDay || null
      });

      setMessage({ type: 'success', text: 'Race data updated!' });
      fetchRaceResult(selectedRace);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update race data' });
    } finally {
      setActionLoading(false);
    }
  };

  const calculateScores = async () => {
    if (!selectedRace) return;

    setActionLoading(true);
    setMessage(null);

    const raceId = `${new Date(selectedRace.date).getFullYear()}_${selectedRace.round}`;

    try {
      const result = await calculateAndSaveScores(raceId);
      setMessage({
        type: 'success',
        text: `Scores calculated for ${result.scoresCalculated} predictions!`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to calculate scores'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const isPastRace = (race) => {
    return new Date(race.date) < new Date();
  };

  // Redirect non-host users
  if (!currentUser) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">Please select a user first</p>
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className="card text-center py-8">
        <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v4h8zM5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
        </svg>
        <h2 className="text-xl font-bold mb-2">Host Access Required</h2>
        <p className="text-gray-400">Only hosts can access the admin dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-f1-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Race Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Select Race</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {races.map((race) => (
              <button
                key={race.round}
                onClick={() => setSelectedRace(race)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedRace?.round === race.round
                    ? 'bg-f1-red text-white'
                    : 'bg-f1-dark hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">R{race.round}: {race.raceName}</span>
                    <p className="text-sm opacity-75">{race.date}</p>
                  </div>
                  {isPastRace(race) ? (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">Past</span>
                  ) : (
                    <span className="text-xs bg-green-700 px-2 py-1 rounded">Upcoming</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {selectedRace ? (
            <>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedRace.raceName}
                </h2>

                {/* Fetch Results Button */}
                <button
                  onClick={fetchResults}
                  disabled={actionLoading || !isPastRace(selectedRace)}
                  className="btn-primary w-full mb-4 disabled:opacity-50"
                >
                  {actionLoading ? 'Loading...' : 'Create Race Result Entry'}
                </button>

                {!isPastRace(selectedRace) && (
                  <p className="text-yellow-500 text-sm mb-4">
                    Race hasn't happened yet. Results not available.
                  </p>
                )}

                {/* Result Status */}
                {raceResult && (
                  <div className="bg-f1-dark p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-2">Current Results</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                      <div>
                        <span className="text-gray-400">P1:</span>
                        <span className="ml-2">{raceResult.p1 || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">P2:</span>
                        <span className="ml-2">{raceResult.p2 || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">P3:</span>
                        <span className="ml-2">{raceResult.p3 || 'N/A'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      Created: {new Date(raceResult.fetched_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Data Entry */}
              {raceResult && (
                <div className="card">
                  <h3 className="font-semibold mb-4">Manual Data Entry</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Enter race data that needs to be filled in manually:
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Safety Car</span>
                      <button
                        onClick={() => setManualInputs(p => ({ ...p, safetyCar: !p.safetyCar }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          manualInputs.safetyCar ? 'bg-f1-red' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          manualInputs.safetyCar ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Red Flag</span>
                      <button
                        onClick={() => setManualInputs(p => ({ ...p, redFlag: !p.redFlag }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          manualInputs.redFlag ? 'bg-f1-red' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          manualInputs.redFlag ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Driver of the Day</label>
                      <select
                        value={manualInputs.driverOfTheDay}
                        onChange={(e) => setManualInputs(p => ({ ...p, driverOfTheDay: e.target.value }))}
                        className="select w-full"
                      >
                        <option value="">Select driver...</option>
                        {drivers.map(driver => (
                          <option key={driver.driverId} value={driver.driverId}>
                            {driver.name} ({driver.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={updateManualData}
                      disabled={actionLoading}
                      className="btn-secondary w-full"
                    >
                      Save Manual Data
                    </button>
                  </div>
                </div>
              )}

              {/* Calculate Scores */}
              {raceResult && (
                <div className="card">
                  <h3 className="font-semibold mb-4">Calculate Scores</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Once all results are in, calculate scores for all predictions.
                  </p>
                  <button
                    onClick={calculateScores}
                    disabled={actionLoading}
                    className="btn-primary w-full"
                  >
                    {actionLoading ? 'Calculating...' : 'Calculate All Scores'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-400">Select a race to manage results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
