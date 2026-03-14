import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getPredictions } from '../lib/api';
import DriverAvatar from '../components/DriverAvatar';
import { races2026 } from '../data/races2026';

function PredictionCard({ prediction, isCurrentUser }) {
  const user = prediction.users || {};
  const top10 = prediction.top_10 || [];
  const dnfs = prediction.dnf_drivers || [];

  return (
    <div className={`card space-y-4 ${isCurrentUser ? 'ring-2 ring-f1-red' : ''}`}>
      {/* User header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{user.emoji || '👤'}</span>
        <div>
          <h3 className="font-bold text-white">{user.name || 'Unknown'}</h3>
          {isCurrentUser && <span className="text-xs text-f1-red font-semibold">You</span>}
        </div>
      </div>

      {/* Top 10 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Top 10</h4>
        <div className="space-y-1.5">
          {top10.length > 0 ? top10.map((driver, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-xs w-4 text-right font-bold shrink-0 ${i < 3 ? 'text-f1-red' : 'text-gray-500'}`}>
                {i + 1}
              </span>
              <DriverAvatar driver={driver} size="sm" showName />
            </div>
          )) : (
            <span className="text-gray-500 text-sm">No top 10 submitted</span>
          )}
        </div>
      </div>

      {/* Other predictions grid */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-700 text-sm">
        <div>
          <p className="text-xs text-gray-400 mb-1">Pole Position</p>
          {prediction.pole_position
            ? <DriverAvatar driver={prediction.pole_position} size="sm" showName />
            : <span className="text-gray-500">—</span>}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Fastest Lap</p>
          {prediction.fastest_lap
            ? <DriverAvatar driver={prediction.fastest_lap} size="sm" showName />
            : <span className="text-gray-500">—</span>}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Driver of the Day</p>
          {prediction.driver_of_the_day
            ? <DriverAvatar driver={prediction.driver_of_the_day} size="sm" showName />
            : <span className="text-gray-500">—</span>}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Winning Margin</p>
          <span className="text-white">{prediction.winning_margin_bracket || '—'}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Safety Car</p>
          <span className={prediction.safety_car ? 'text-yellow-400 font-semibold' : 'text-gray-400'}>
            {prediction.safety_car ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Red Flag</p>
          <span className={prediction.red_flag ? 'text-f1-red font-semibold' : 'text-gray-400'}>
            {prediction.red_flag ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* DNFs */}
      {dnfs.length > 0 && (
        <div className="pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">DNFs</p>
          <div className="flex flex-wrap gap-2">
            {dnfs.map(d => (
              <DriverAvatar key={d} driver={d} size="sm" showName />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewPredictions() {
  const { currentUser } = useUser();
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Races where qualifying has already started (predictions are locked)
  const lockedRaces = races2026.filter(r => {
    const qualDate = new Date(`${r.qualifyingDate}T${r.qualifyingTime || '14:00:00Z'}`);
    return new Date() > qualDate;
  });

  useEffect(() => {
    if (lockedRaces.length > 0 && !selectedRaceId) {
      const latest = lockedRaces[lockedRaces.length - 1];
      setSelectedRaceId(`2026_${latest.round}`);
    }
  }, []);

  useEffect(() => {
    if (selectedRaceId) fetchPredictions();
  }, [selectedRaceId]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await getPredictions(selectedRaceId);
      setPredictions(data);
    } catch (e) {
      console.error('Error fetching predictions:', e);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedRace = lockedRaces.find(r => `2026_${r.round}` === selectedRaceId);

  if (lockedRaces.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Predictions</h1>
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-white font-semibold text-lg">Predictions are locked until qualifying</p>
          <p className="text-gray-400 text-sm mt-2">
            Everyone's picks will appear here once qualifying starts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Predictions</h1>
        <select
          value={selectedRaceId || ''}
          onChange={e => setSelectedRaceId(e.target.value)}
          className="select"
        >
          {[...lockedRaces].reverse().map(r => (
            <option key={r.round} value={`2026_${r.round}`}>
              R{r.round} — {r.name.replace(' Grand Prix', '')}
            </option>
          ))}
        </select>
      </div>

      {selectedRace && (
        <p className="text-gray-400 text-sm -mt-2">
          {selectedRace.name} &middot;{' '}
          {new Date(`${selectedRace.date}T12:00:00`).toLocaleDateString('en-AU', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-f1-red" />
        </div>
      ) : predictions.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No predictions submitted for this race.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {predictions.map(p => (
            <PredictionCard
              key={p.id}
              prediction={p}
              isCurrentUser={p.user_id === currentUser?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewPredictions;
