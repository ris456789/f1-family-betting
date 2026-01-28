import { useState, useEffect } from 'react';

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();

    if (difference <= 0) {
      return { expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 text-yellow-500">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span className="font-bold">Predictions Locked</span>
      </div>
    );
  }

  return (
    <div className="countdown-container">
      {timeLeft.days > 0 && (
        <>
          <div className="countdown-unit">
            <div className="countdown-number">
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <div className="countdown-label">days</div>
          </div>
          <span className="countdown-separator">:</span>
        </>
      )}

      <div className="countdown-unit">
        <div className="countdown-number">
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <div className="countdown-label">hrs</div>
      </div>

      <span className="countdown-separator">:</span>

      <div className="countdown-unit">
        <div className="countdown-number">
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <div className="countdown-label">min</div>
      </div>

      <span className="countdown-separator">:</span>

      <div className="countdown-unit">
        <div className="countdown-number">
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <div className="countdown-label">sec</div>
      </div>
    </div>
  );
}

export default CountdownTimer;
