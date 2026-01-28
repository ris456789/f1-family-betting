import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDriverByCode } from '../data/drivers2025';
import { getScoreRating } from '../data/mockRaceData';

function MockResultsView({ results, prediction, actual, onTryAgain, onBackHome }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const rating = getScoreRating(results.totalScore);

  // Animate score counting up
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = results.totalScore / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= results.totalScore) {
        setAnimatedScore(results.totalScore);
        clearInterval(timer);
        if (results.totalScore >= 80) {
          setShowConfetti(true);
        }
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [results.totalScore]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Confetti effect for high scores */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#FF8000', '#E80020', '#3671C6', '#27F4D2', '#FFD700'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}

      {/* Mock Trial Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-center py-2 px-4 rounded-t-lg font-bold">
        🧪 MOCK TRIAL RESULTS
      </div>

      <div className="card rounded-t-none">
        {/* Score Header */}
        <div className="text-center py-8 border-b border-gray-700">
          <div className="text-6xl mb-4">{rating.emoji}</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: rating.color }}>
            {rating.title}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-6xl font-bold text-amber-500">{animatedScore}</span>
            <span className="text-2xl text-gray-400">/ {results.maxPossible}</span>
            <span className="text-xl text-gray-500">pts</span>
          </div>
          <div className="mt-4 w-full max-w-md mx-auto bg-f1-dark rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-1000"
              style={{ width: `${results.percentage}%` }}
            />
          </div>
          <p className="text-gray-400 mt-2">{results.percentage}% accuracy</p>
        </div>

        {/* Results Breakdown */}
        <div className="py-6">
          <h2 className="text-xl font-bold mb-4">Detailed Breakdown</h2>
          <div className="space-y-2">
            {results.breakdown.map((item, index) => (
              <ResultRow key={index} item={item} />
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-700">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-500">
              {results.breakdown.filter(b => b.correct).length}
            </p>
            <p className="text-sm text-gray-400">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-500">
              {results.breakdown.filter(b => !b.correct).length}
            </p>
            <p className="text-sm text-gray-400">Wrong</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-500">
              {results.totalScore}
            </p>
            <p className="text-sm text-gray-400">Total Points</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-700">
          <button
            onClick={onTryAgain}
            className="btn-secondary flex-1"
          >
            🔄 Try Again
          </button>
          <button
            onClick={onBackHome}
            className="btn-secondary flex-1"
          >
            ← Back to Home
          </button>
          <Link
            to="/"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2 px-6 rounded text-center flex-1"
          >
            🏁 Play for Real
          </Link>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function ResultRow({ item }) {
  const predictedDriver = item.predicted && typeof item.predicted === 'string' && item.predicted.length === 3
    ? getDriverByCode(item.predicted)
    : null;
  const actualDriver = item.actual && typeof item.actual === 'string' && item.actual.length === 3
    ? getDriverByCode(item.actual)
    : null;

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg ${
        item.correct ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}
    >
      {/* Status Icon */}
      <div className={`text-2xl ${item.correct ? 'text-green-500' : 'text-red-500'}`}>
        {item.correct ? '✓' : '✗'}
      </div>

      {/* Category */}
      <div className="flex-1">
        <p className="font-medium">{item.category}</p>
        <div className="flex items-center gap-4 text-sm mt-1">
          <span className="text-gray-400">
            You: {predictedDriver ? (
              <span className="inline-flex items-center gap-1">
                <img
                  src={predictedDriver.headshot}
                  alt={predictedDriver.name}
                  className="w-5 h-5 rounded-full inline"
                />
                {predictedDriver.name}
              </span>
            ) : item.predicted || 'None'}
          </span>
          <span className="text-gray-500">→</span>
          <span className={item.correct ? 'text-green-400' : 'text-gray-400'}>
            Actual: {actualDriver ? (
              <span className="inline-flex items-center gap-1">
                <img
                  src={actualDriver.headshot}
                  alt={actualDriver.name}
                  className="w-5 h-5 rounded-full inline"
                />
                {actualDriver.name}
              </span>
            ) : item.actual || 'None'}
          </span>
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <span className={`text-xl font-bold ${item.points > 0 ? 'text-green-500' : 'text-gray-500'}`}>
          {item.points > 0 ? `+${item.points}` : '0'}
        </span>
        <p className="text-xs text-gray-500">/ {item.maxPoints}</p>
      </div>
    </div>
  );
}

export default MockResultsView;
