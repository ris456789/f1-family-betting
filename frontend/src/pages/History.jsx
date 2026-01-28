import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import LeaderboardTable from '../components/LeaderboardTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function History() {
  const { currentUser } = useUser();
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [raceScores, setRaceScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRaces();
  }, [year]);

  useEffect(() => {
    if (selectedRace) {
      fetchRaceScores(selectedRace);
    }
  }, [selectedRace]);

  const fetchRaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/leaderboard/history/races`, { params: { year } });
      setRaces(response.data);
      if (response.data.length > 0) {
        setSelectedRace(response.data[response.data.length - 1].race_id);
      }
    } catch (error) {
      console.error('Error fetching races:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaceScores = async (raceId) => {
    try {
      const response = await axios.get(`${API_URL}/leaderboard/${raceId}`);
      setRaceScores(response.data);
    } catch (error) {
      console.error('Error fetching race scores:', error);
      setRaceScores([]);
    }
  };

  const selectedRaceInfo = races.find(r => r.race_id === selectedRace);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-f1-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Race History</h1>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="select"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y} Season</option>
          ))}
        </select>
      </div>

      {races.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No completed races with results yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Race List */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Completed Races</h2>
            <div className="space-y-2">
              {races.map((race) => (
                <button
                  key={race.race_id}
                  onClick={() => setSelectedRace(race.race_id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedRace === race.race_id
                      ? 'bg-f1-red text-white'
                      : 'bg-f1-gray hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">R{race.race_round}</span>
                    <span className="text-sm opacity-75">{race.race_name?.replace(' Grand Prix', '')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Race Details */}
          <div className="md:col-span-2">
            {selectedRaceInfo && (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  {selectedRaceInfo.race_name} Results
                </h2>
                <LeaderboardTable leaderboard={raceScores} showBreakdown={true} />
              </>
            )}
          </div>
        </div>
      )}

      {/* User's Prediction History */}
      {currentUser && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            {currentUser.emoji} {currentUser.name}'s Race-by-Race Performance
          </h2>
          {races.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-600">
                    <th className="text-left py-2">Race</th>
                    <th className="text-center py-2">Points</th>
                    <th className="text-center py-2">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((race) => {
                    const userScore = raceScores.find(s =>
                      s.user_id === currentUser.id && selectedRace === race.race_id
                    );
                    return (
                      <tr key={race.race_id} className="border-b border-gray-700">
                        <td className="py-2">
                          R{race.race_round} - {race.race_name?.replace(' Grand Prix', '')}
                        </td>
                        <td className="text-center py-2 text-f1-red font-semibold">
                          {userScore?.total_points || '-'}
                        </td>
                        <td className="text-center py-2">
                          {userScore?.position || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No race history available yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default History;
