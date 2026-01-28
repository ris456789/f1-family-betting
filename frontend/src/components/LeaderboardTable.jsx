import { useState } from 'react';

function LeaderboardTable({ leaderboard, showBreakdown = false }) {
  const [expandedUser, setExpandedUser] = useState(null);

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">No results yet</p>
      </div>
    );
  }

  const getMedalEmoji = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case 1: return 'bg-yellow-500/20 border-yellow-500';
      case 2: return 'bg-gray-400/20 border-gray-400';
      case 3: return 'bg-amber-700/20 border-amber-700';
      default: return 'bg-f1-gray border-transparent';
    }
  };

  return (
    <div className="space-y-2">
      {leaderboard.map((entry) => (
        <div key={entry.user_id}>
          <div
            className={`card border-l-4 ${getPositionStyle(entry.position)} ${
              showBreakdown ? 'cursor-pointer hover:bg-f1-dark/50' : ''
            }`}
            onClick={() => showBreakdown && setExpandedUser(
              expandedUser === entry.user_id ? null : entry.user_id
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-2xl w-10 text-center">
                  {getMedalEmoji(entry.position) || (
                    <span className="text-gray-400 text-lg">{entry.position}</span>
                  )}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{entry.emoji}</span>
                  <span className="font-semibold text-lg">{entry.user_name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-f1-red">
                  {entry.total_points}
                  <span className="text-sm text-gray-400 ml-1">pts</span>
                </div>
                {entry.races_predicted > 0 && (
                  <div className="text-xs text-gray-400">
                    {entry.races_predicted} races • avg {entry.avg_points}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expanded breakdown */}
          {showBreakdown && expandedUser === entry.user_id && entry.breakdown && (
            <div className="ml-14 mt-2 p-4 bg-f1-dark rounded-lg">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Points Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.entries(entry.breakdown)
                  .filter(([key, value]) => key !== 'total' && value > 0)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between bg-f1-gray rounded px-2 py-1">
                      <span className="text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace('_', ' ')}
                      </span>
                      <span className="text-f1-red font-semibold">+{value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default LeaderboardTable;
