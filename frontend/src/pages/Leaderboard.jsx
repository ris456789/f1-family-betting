import { useState, useEffect } from 'react';
import axios from 'axios';
import LeaderboardTable from '../components/LeaderboardTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchLeaderboard();
  }, [year]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/leaderboard`, { params: { year } });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-f1-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Season Leaderboard</h1>
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

      <LeaderboardTable leaderboard={leaderboard} />

      {/* Stats Summary */}
      {leaderboard.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Season Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Total Races</p>
              <p className="text-2xl font-bold text-f1-red">
                {leaderboard[0]?.races_predicted || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Highest Score</p>
              <p className="text-2xl font-bold text-f1-red">
                {leaderboard[0]?.total_points || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Participants</p>
              <p className="text-2xl font-bold text-f1-red">
                {leaderboard.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
