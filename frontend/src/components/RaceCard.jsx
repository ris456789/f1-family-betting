import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';

function RaceCard({ race, showPredictButton = true }) {
  if (!race) return null;

  const raceDate = new Date(`${race.date}T${race.time || '14:00:00Z'}`);
  const qualifyingDate = race.qualifyingDate
    ? new Date(`${race.qualifyingDate}T${race.qualifyingTime || '14:00:00Z'}`)
    : null;

  // Predictions lock at qualifying start
  const lockTime = qualifyingDate || new Date(raceDate.getTime() - 2 * 60 * 60 * 1000);
  const isLocked = new Date() > lockTime;

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const raceId = `${new Date(race.date).getFullYear()}_${race.round}`;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-f1-red text-sm font-semibold">Round {race.round}</span>
          <h3 className="text-xl font-bold mt-1">{race.raceName}</h3>
          <p className="text-gray-400">{race.circuitName}</p>
          <p className="text-sm text-gray-500">{race.locality}, {race.country}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{formatDate(raceDate)}</p>
          <p className="text-gray-400">{formatTime(raceDate)}</p>
        </div>
      </div>

      {/* Session Times */}
      <div className="border-t border-gray-600 pt-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {qualifyingDate && (
            <div>
              <p className="text-gray-400">Qualifying</p>
              <p>{formatDate(qualifyingDate)} {formatTime(qualifyingDate)}</p>
            </div>
          )}
          {race.sprintDate && (
            <div>
              <p className="text-gray-400">Sprint</p>
              <p>{formatDate(new Date(`${race.sprintDate}T${race.sprintTime || '14:00:00Z'}`))} {formatTime(new Date(`${race.sprintDate}T${race.sprintTime || '14:00:00Z'}`))}</p>
            </div>
          )}
        </div>
      </div>

      {/* Countdown and Lock Status */}
      <div className="border-t border-gray-600 pt-4">
        {isLocked ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-yellow-500">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Predictions Locked</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Predictions lock in</p>
              <CountdownTimer targetDate={lockTime} />
            </div>
            {showPredictButton && (
              <Link
                to={`/predict/${raceId}`}
                className="btn-primary"
              >
                Make Prediction
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RaceCard;
