import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { heroImages, getCircuitImage, getCountryFlag } from '../data/f1Images';
import { drivers2025 } from '../data/drivers2025';
import CountdownTimer from '../components/CountdownTimer';
import PotCard from '../components/PotCard';
import { getNextRace, getLeaderboard } from '../lib/api';

function Home() {
  const { currentUser } = useUser();
  const [nextRace, setNextRace] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get next race from local data
      const race = getNextRace();
      setNextRace(race);

      // Get leaderboard from Supabase
      try {
        const leaderboardData = await getLeaderboard();
        setLeaderboard(leaderboardData.slice(0, 3));
      } catch (e) {
        console.log('Could not fetch leaderboard:', e.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const raceDate = nextRace ? new Date(`${nextRace.date}T${nextRace.time || '14:00:00Z'}`) : null;
  const qualifyingDate = nextRace?.qualifyingDate
    ? new Date(`${nextRace.qualifyingDate}T${nextRace.qualifyingTime || '14:00:00Z'}`)
    : raceDate;

  return (
    <div className="space-y-8 -mt-6">
      {/* Hero Section with Background Image */}
      <div
        className="hero-section"
        style={{
          backgroundImage: `url('${heroImages.home}')`
        }}
      >
        {/* Racing Stripes */}
        <div className="racing-stripes"></div>

        {/* Content */}
        <h1 className="text-5xl md:text-6xl font-bold mb-3 text-center">
          <span className="text-f1-red">F1</span> Family Betting
        </h1>
        <p className="text-xl text-gray-300 mb-8 text-center max-w-lg">
          {currentUser
            ? `Welcome back, ${currentUser.name}! Ready to make your predictions?`
            : 'Select a player above to get started'}
        </p>

        {/* Mock Trial Button */}
        <Link
          to="/mock-trial"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-orange-500/30"
        >
          <span className="text-2xl">🏁</span>
          <span>Try Mock Trial</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">NEW</span>
        </Link>
        <p className="text-sm text-gray-400 mt-3">
          Practice with past race data before the real thing!
        </p>
      </div>

      {/* Next Race Card */}
      {nextRace && (
        <section>
          <div className="section-header">
            <span className="section-title">Next Race</span>
          </div>

          <div className="race-card">
            {/* Circuit Image */}
            <div className="race-card-circuit">
              <img
                src={getCircuitImage(nextRace.circuitName || nextRace.locality)}
                alt={nextRace.circuitName}
              />
            </div>

            {/* Race Info */}
            <div className="race-card-content">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="round-badge">Round {nextRace.round}</span>
                  <h2 className="text-2xl font-bold mt-2">{nextRace.raceName}</h2>
                  <p className="text-gray-400 mt-1">
                    {nextRace.circuitName} • {nextRace.locality}
                  </p>
                </div>
                <span className="text-5xl">
                  {getCountryFlag(nextRace.country)}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
                <div>
                  <span className="block text-white font-semibold">
                    {raceDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  <span>Race Start: {raceDate?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Countdown */}
              <div className="border-t border-gray-700 pt-4">
                <p className="text-sm text-gray-400 mb-3">Predictions lock in:</p>
                <div className="flex items-center justify-between">
                  <CountdownTimer targetDate={qualifyingDate} />
                  {currentUser && (
                    <Link
                      to={`/predict/${new Date(nextRace.date).getFullYear()}_${nextRace.round}`}
                      className="btn-primary"
                    >
                      Make Prediction →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Drivers Carousel */}
      <section>
        <div className="section-header">
          <span className="section-title">2026 Grid</span>
        </div>

        <div className="drivers-carousel">
          {drivers2025.slice(0, 12).map((driver) => (
            <div
              key={driver.code}
              className="driver-card"
              style={{ borderLeftColor: driver.teamColor }}
            >
              <div
                className="driver-card-image-container"
                style={{ backgroundColor: driver.teamColor + '20' }}
              >
                <img
                  src={driver.headshot}
                  alt={driver.name}
                  className="driver-card-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div style="
                        width: 100%;
                        height: 100%;
                        background: ${driver.teamColor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2rem;
                        font-weight: bold;
                        color: white;
                      ">
                        ${driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    `;
                  }}
                />
              </div>
              <span
                className="driver-number"
                style={{ backgroundColor: driver.teamColor }}
              >
                #{driver.number}
              </span>
              <div className="driver-card-info">
                <span className="driver-name">{driver.name.split(' ')[1]}</span>
                <span className="driver-team">{driver.team}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prize Pot */}
      {nextRace && (
        <section>
          <div className="section-header">
            <span className="section-title">This Race's Pot</span>
          </div>
          <PotCard race={nextRace} />
        </section>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Leaderboard Preview */}
        <section>
          <div className="section-header">
            <span className="section-title">Season Standings</span>
          </div>

          <div className="card">
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`leaderboard-row position-${index + 1}`}
                  >
                    <span className="position-badge">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="text-2xl mr-3">{entry.emoji}</span>
                    <span className="font-semibold flex-1">{entry.user_name}</span>
                    <span className="text-f1-red font-bold text-xl">
                      {entry.total_points}
                      <span className="text-gray-400 text-sm ml-1">pts</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-5xl mb-4 block">🏎️</span>
                <p className="text-gray-400">No scores yet</p>
                <p className="text-sm text-gray-500">Make predictions to compete!</p>
              </div>
            )}

            <Link
              to="/leaderboard"
              className="block text-center text-f1-red hover:underline mt-4 pt-4 border-t border-gray-700"
            >
              View Full Leaderboard →
            </Link>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="section-header">
            <span className="section-title">Quick Actions</span>
          </div>

          <div className="card space-y-3">
            {nextRace && currentUser && (
              <Link
                to={`/predict/${new Date(nextRace.date).getFullYear()}_${nextRace.round}`}
                className="flex items-center p-4 bg-gradient-to-r from-f1-red/20 to-transparent rounded-lg hover:from-f1-red/30 transition-all group"
              >
                <span className="text-3xl mr-4 group-hover:scale-110 transition-transform">🎯</span>
                <div className="flex-1">
                  <span className="font-semibold block">Make Prediction</span>
                  <span className="text-sm text-gray-400">{nextRace.raceName}</span>
                </div>
                <svg className="w-5 h-5 text-f1-red group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            <Link
              to="/mock-trial"
              className="flex items-center p-4 bg-gradient-to-r from-amber-500/20 to-transparent rounded-lg hover:from-amber-500/30 transition-all group"
            >
              <span className="text-3xl mr-4 group-hover:scale-110 transition-transform">🧪</span>
              <div className="flex-1">
                <span className="font-semibold block">Mock Trial</span>
                <span className="text-sm text-gray-400">Practice with a past race before the real thing</span>
              </div>
              <svg className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/history"
              className="flex items-center p-4 bg-gradient-to-r from-blue-500/20 to-transparent rounded-lg hover:from-blue-500/30 transition-all group"
            >
              <span className="text-3xl mr-4 group-hover:scale-110 transition-transform">📊</span>
              <div className="flex-1">
                <span className="font-semibold block">Race History</span>
                <span className="text-sm text-gray-400">View past predictions & results</span>
              </div>
              <svg className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/leaderboard"
              className="flex items-center p-4 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg hover:from-yellow-500/30 transition-all group"
            >
              <span className="text-3xl mr-4 group-hover:scale-110 transition-transform">🏆</span>
              <div className="flex-1">
                <span className="font-semibold block">Full Leaderboard</span>
                <span className="text-sm text-gray-400">Season standings & stats</span>
              </div>
              <svg className="w-5 h-5 text-yellow-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </div>

      {/* Points System */}
      <section>
        <div className="section-header">
          <span className="section-title">Points System</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Podium Exact (P1/2/3)', points: 15, icon: '🥇', note: 'per pick' },
            { label: 'Podium, Wrong Spot', points: 10, icon: '🎖️', note: 'in top 3' },
            { label: 'P4–P10 Exact', points: 5, icon: '🎯', note: '−1 per pos off' },
            { label: 'Fastest Lap', points: 5, icon: '⚡' },
            { label: 'Pole Position', points: 5, icon: '🏁' },
            { label: 'Red Flag', points: 8, icon: '🚩' },
            { label: 'Safety Car', points: 5, icon: '🚗' },
            { label: 'DNF Correct', points: 5, icon: '💀', note: 'per driver' },
          ].map((item) => (
            <div
              key={item.label}
              className="card flex items-center gap-3 p-4"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-xl font-bold text-f1-red">{item.points} pts</p>
                {item.note && <p className="text-xs text-gray-500">{item.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
