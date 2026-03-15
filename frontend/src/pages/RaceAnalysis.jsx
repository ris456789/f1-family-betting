import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getCompletedRaces, getRaceAnalysis, getWinningMarginBracket } from '../lib/api';
import DriverAvatar from '../components/DriverAvatar';

// ─── Points badge ────────────────────────────────────────────────────────────

function PtsBadge({ pts, show = true }) {
  if (!show) return null;
  if (pts > 0) {
    return (
      <span className="ml-auto shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        +{pts}
      </span>
    );
  }
  return (
    <span className="ml-auto shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-500">
      0
    </span>
  );
}

// ─── Actual race result panel ─────────────────────────────────────────────────

function ActualResultPanel({ result }) {
  const top10 = result.top_10 || [];
  const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const marginBracket = result.winning_margin != null
    ? getWinningMarginBracket(result.winning_margin)
    : null;

  return (
    <div className="card space-y-5">
      <h2 className="text-lg font-bold text-white">Official Results</h2>

      {/* Top 10 */}
      <div className="space-y-1.5">
        {top10.map((driverId, i) => (
          <div
            key={driverId}
            className="flex items-center gap-3 p-2 rounded-lg bg-f1-dark"
            style={i < 3 ? { borderLeft: `3px solid ${podiumColors[i]}` } : { borderLeft: '3px solid transparent' }}
          >
            <span className={`w-6 text-right text-sm font-bold shrink-0 ${i < 3 ? 'text-white' : 'text-gray-500'}`}>
              {i + 1}
            </span>
            <DriverAvatar driver={driverId} size="sm" showName />
          </div>
        ))}
      </div>

      {/* Bonus facts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-gray-700 text-sm">
        <div className="bg-f1-dark rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">🏁 Pole Position</p>
          {result.pole_position
            ? <DriverAvatar driver={result.pole_position} size="sm" showName />
            : <span className="text-gray-500">—</span>}
        </div>
        <div className="bg-f1-dark rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">⚡ Fastest Lap</p>
          {result.fastest_lap
            ? <DriverAvatar driver={result.fastest_lap} size="sm" showName />
            : <span className="text-gray-500">—</span>}
        </div>
        <div className="bg-f1-dark rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">⭐ Driver of the Day</p>
          {result.driver_of_the_day
            ? <DriverAvatar driver={result.driver_of_the_day} size="sm" showName />
            : <span className="text-gray-500">—</span>}
        </div>
        <div className="bg-f1-dark rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">🚗 Safety Car</p>
          <span className={result.safety_car ? 'text-yellow-400 font-semibold' : 'text-gray-400'}>
            {result.safety_car ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="bg-f1-dark rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">🚩 Red Flag</p>
          <span className={result.red_flag ? 'text-f1-red font-semibold' : 'text-gray-400'}>
            {result.red_flag ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="bg-f1-dark rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">⏱ Winning Margin</p>
          <span className="text-white">
            {marginBracket || (result.winning_margin != null ? `${result.winning_margin.toFixed(1)}s` : '—')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Per-player analysis card ─────────────────────────────────────────────────

function PlayerAnalysisCard({ player, result, rank, isCurrentUser }) {
  const user = player.users || {};
  const breakdown = player.score?.points_breakdown || {};
  const totalPoints = player.score?.total_points ?? null;

  const actualTop10 = result.top_10 || [];
  const predTop10 = player.top_10 || [];
  const actualPodium = actualTop10.slice(0, 3);

  const marginBracket = result.winning_margin != null
    ? getWinningMarginBracket(result.winning_margin)
    : null;

  const medals = ['🥇', '🥈', '🥉'];
  const rankColors = [
    'bg-yellow-500/20 border-yellow-500',
    'bg-gray-400/20 border-gray-400',
    'bg-amber-700/20 border-amber-700',
  ];

  // Per-position points for top 10
  function posPoints(i) {
    const driver = predTop10[i];
    if (!driver) return { pts: 0, miss: true };
    if (i < 3) {
      if (actualTop10[i] === driver) return { pts: 15, exact: true };
      if (actualPodium.includes(driver)) return { pts: 10, partial: true };
      return { pts: 0 };
    } else {
      const actualIdx = actualTop10.indexOf(driver);
      if (actualIdx === -1) return { pts: 0 };
      const pts = Math.max(0, 5 - Math.abs(i - actualIdx));
      return { pts, exact: pts === 5, partial: pts > 0 };
    }
  }

  function ptsColor(pts, max) {
    if (pts >= max) return 'text-green-400';
    if (pts > 0) return 'text-yellow-400';
    return 'text-gray-500';
  }

  return (
    <div className={`card space-y-4 border-l-4 ${rank <= 3 ? rankColors[rank - 1] : 'border-transparent'} ${isCurrentUser ? 'ring-2 ring-f1-red' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{medals[rank - 1] || <span className="text-gray-400 text-lg font-bold">{rank}</span>}</span>
          <span className="text-3xl">{user.emoji || '👤'}</span>
          <div>
            <h3 className="font-bold text-white">{user.name || 'Unknown'}</h3>
            {isCurrentUser && <span className="text-xs text-f1-red font-semibold">You</span>}
          </div>
        </div>
        <div className="text-right">
          {totalPoints != null ? (
            <span className="text-3xl font-black text-f1-red">{totalPoints}<span className="text-sm text-gray-400 ml-1 font-normal">pts</span></span>
          ) : (
            <span className="text-sm text-gray-500">No score</span>
          )}
        </div>
      </div>

      {/* Top 10 predictions */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Top 10 Picks</h4>
        <div className="space-y-1">
          {predTop10.map((driverId, i) => {
            const { pts, exact, partial } = posPoints(i);
            const actualPos = actualTop10.indexOf(driverId);
            const showActual = !exact && actualPos !== -1;
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs w-4 text-right font-bold shrink-0 text-gray-500">{i + 1}</span>
                <DriverAvatar driver={driverId} size="sm" showName />
                {showActual && (
                  <span className="text-xs text-gray-500 shrink-0">→ actual P{actualPos + 1}</span>
                )}
                {!exact && actualTop10[i] !== driverId && actualTop10.indexOf(driverId) === -1 && (
                  <span className="text-xs text-gray-600 shrink-0">✗</span>
                )}
                <PtsBadge pts={pts} />
              </div>
            );
          })}
          {predTop10.length === 0 && (
            <span className="text-gray-500 text-sm">No top 10 submitted</span>
          )}
        </div>
      </div>

      {/* Bonus picks */}
      <div className="pt-3 border-t border-gray-700">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bonus Picks</h4>
        <div className="space-y-2">

          {/* Pole */}
          <BonusRow
            label="🏁 Pole"
            predicted={player.pole_position ? <DriverAvatar driver={player.pole_position} size="sm" showName /> : <span className="text-gray-500">—</span>}
            actual={result.pole_position ? <DriverAvatar driver={result.pole_position} size="sm" showName /> : <span className="text-gray-500">—</span>}
            correct={player.pole_position && player.pole_position === result.pole_position}
            pts={player.pole_position && player.pole_position === result.pole_position ? 5 : 0}
          />

          {/* Fastest lap */}
          <BonusRow
            label="⚡ Fastest Lap"
            predicted={player.fastest_lap ? <DriverAvatar driver={player.fastest_lap} size="sm" showName /> : <span className="text-gray-500">—</span>}
            actual={result.fastest_lap ? <DriverAvatar driver={result.fastest_lap} size="sm" showName /> : <span className="text-gray-500">—</span>}
            correct={player.fastest_lap && player.fastest_lap === result.fastest_lap}
            pts={player.fastest_lap && player.fastest_lap === result.fastest_lap ? 5 : 0}
          />

          {/* Driver of the day */}
          <BonusRow
            label="⭐ DOTD"
            predicted={player.driver_of_the_day ? <DriverAvatar driver={player.driver_of_the_day} size="sm" showName /> : <span className="text-gray-500">—</span>}
            actual={result.driver_of_the_day ? <DriverAvatar driver={result.driver_of_the_day} size="sm" showName /> : <span className="text-gray-500">—</span>}
            correct={player.driver_of_the_day && player.driver_of_the_day === result.driver_of_the_day}
            pts={player.driver_of_the_day && player.driver_of_the_day === result.driver_of_the_day ? 5 : 0}
          />

          {/* Safety car */}
          <BonusRow
            label="🚗 Safety Car"
            predicted={<span className={player.safety_car ? 'text-yellow-400' : 'text-gray-400'}>{player.safety_car ? 'Yes' : 'No'}</span>}
            actual={<span className={result.safety_car ? 'text-yellow-400' : 'text-gray-400'}>{result.safety_car ? 'Yes' : 'No'}</span>}
            correct={result.safety_car != null && !!player.safety_car === !!result.safety_car}
            pts={result.safety_car != null && !!player.safety_car === !!result.safety_car ? 5 : 0}
          />

          {/* Red flag */}
          <BonusRow
            label="🚩 Red Flag"
            predicted={<span className={player.red_flag ? 'text-f1-red' : 'text-gray-400'}>{player.red_flag ? 'Yes' : 'No'}</span>}
            actual={<span className={result.red_flag ? 'text-f1-red' : 'text-gray-400'}>{result.red_flag ? 'Yes' : 'No'}</span>}
            correct={result.red_flag != null && !!player.red_flag === !!result.red_flag}
            pts={result.red_flag != null && !!player.red_flag === !!result.red_flag ? 8 : 0}
          />

          {/* Winning margin */}
          <BonusRow
            label="⏱ Margin"
            predicted={<span className="text-white">{player.winning_margin_bracket || '—'}</span>}
            actual={<span className="text-white">{marginBracket || '—'}</span>}
            correct={player.winning_margin_bracket && marginBracket && player.winning_margin_bracket === marginBracket}
            pts={player.winning_margin_bracket && marginBracket && player.winning_margin_bracket === marginBracket ? 5 : 0}
          />
        </div>
      </div>

      {/* DNFs */}
      {(player.dnf_drivers || []).length > 0 && (
        <div className="pt-3 border-t border-gray-700">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            DNF Picks
            {breakdown.dnf > 0 && <span className="ml-2 text-green-400">+{breakdown.dnf}</span>}
          </h4>
          <div className="flex flex-wrap gap-2">
            {player.dnf_drivers.map(driverId => {
              const hit = (result.dnf_drivers || []).includes(driverId);
              return (
                <div key={driverId} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${hit ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-gray-700/50 border-gray-600 text-gray-400'}`}>
                  <DriverAvatar driver={driverId} size="sm" showName />
                  {hit ? ' ✓' : ' ✗'}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BonusRow({ label, predicted, actual, correct, pts }) {
  return (
    <div className={`flex items-start gap-3 p-2 rounded-lg text-sm border-l-2 ${correct ? 'border-green-500 bg-green-500/5' : 'border-gray-700 bg-f1-dark'}`}>
      <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          {predicted}
          <span className="text-gray-600 text-xs">→</span>
          {actual}
        </div>
      </div>
      <PtsBadge pts={pts} />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function RaceAnalysis() {
  const { currentUser } = useUser();
  const [races, setRaces] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCompletedRaces().then(data => {
      setRaces(data);
      if (data.length > 0) {
        setSelectedRaceId(data[data.length - 1].race_id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRaceId) return;
    setLoading(true);
    setError(null);
    getRaceAnalysis(selectedRaceId)
      .then(data => setAnalysisData(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedRaceId]);

  const selectedRace = races.find(r => r.race_id === selectedRaceId);

  if (!loading && races.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Race Analysis</h1>
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-white font-semibold text-lg">No completed races yet</p>
          <p className="text-gray-400 text-sm mt-2">Results will appear here after each race.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Race Analysis</h1>
        <select
          value={selectedRaceId || ''}
          onChange={e => setSelectedRaceId(e.target.value)}
          className="select"
        >
          {[...races].reverse().map(r => (
            <option key={r.race_id} value={r.race_id}>
              R{r.race_round} — {r.race_name?.replace(' Grand Prix', '')}
            </option>
          ))}
        </select>
      </div>

      {selectedRace && (
        <p className="text-gray-400 text-sm -mt-2">
          {selectedRace.race_name}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-f1-red" />
        </div>
      ) : error ? (
        <div className="card text-center py-8">
          <p className="text-red-400">{error}</p>
        </div>
      ) : !analysisData?.result ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No results available for this race yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Actual result */}
          <ActualResultPanel result={analysisData.result} />

          {/* No scores yet */}
          {analysisData.players.length > 0 && analysisData.players.every(p => !p.score) && (
            <div className="card text-center py-6">
              <p className="text-yellow-400 font-semibold">Scores haven't been calculated yet for this race.</p>
              <p className="text-gray-400 text-sm mt-1">Check back after the host finalises results in Admin.</p>
            </div>
          )}

          {/* Player cards */}
          {analysisData.players.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No predictions were submitted for this race.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {analysisData.players.map((player, i) => (
                <PlayerAnalysisCard
                  key={player.id}
                  player={player}
                  result={analysisData.result}
                  rank={i + 1}
                  isCurrentUser={player.user_id === currentUser?.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RaceAnalysis;
