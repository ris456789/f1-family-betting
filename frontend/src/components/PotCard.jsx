import { useState, useEffect } from 'react';
import { getRacePot, calcPot } from '../lib/api';
import { useUser } from '../context/UserContext';

const VENMO_USERNAME = 'Rishita-Upadhyay-1';

function getVenmoLink(raceName) {
  const note = encodeURIComponent(`F1 Family Betting - ${raceName}`);
  return `https://venmo.com/u/${VENMO_USERNAME}?txn=pay&amount=10&note=${note}`;
}

function PotCard({ race }) {
  const { users, currentUser } = useUser();
  const [pot, setPot] = useState(null);

  useEffect(() => {
    if (!race) return;
    const raceId = `${new Date(race.date).getFullYear()}_${race.round}`;
    getRacePot(raceId).then(setPot).catch(() => setPot(null));
  }, [race]);

  if (!race) return null;

  const paidIds = pot?.paid_user_ids || [];
  const paidCount = paidIds.length;
  const totalPlayers = users.length;
  const { prizePool, hostTotal, totalCollected } = calcPot(paidCount);
  const isPaidOut = pot?.status === 'paid_out';
  const currentUserPaid = currentUser ? paidIds.includes(currentUser.id) : false;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <p className="font-bold text-lg leading-tight">Race Prize Pot</p>
            <p className="text-xs text-gray-400">{race.raceName}</p>
          </div>
        </div>
        {isPaidOut ? (
          <span className="text-xs bg-green-800 text-green-300 px-2 py-1 rounded-full font-semibold">Paid Out</span>
        ) : (
          <span className="text-xs bg-yellow-800/50 text-yellow-300 px-2 py-1 rounded-full font-semibold">Open</span>
        )}
      </div>

      {/* Prize Pool Big Number */}
      <div className="text-center py-5 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-lg mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Current Prize Pool</p>
        <p className="text-5xl font-black text-yellow-400">${prizePool.toFixed(0)}</p>
        <p className="text-xs text-gray-500 mt-1">{paidCount} of {totalPlayers} players paid in · winner takes all</p>
      </div>

      {/* Pay button */}
      {!isPaidOut && currentUser && !currentUserPaid && (
        <a
          href={getVenmoLink(race.raceName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mb-2 py-3 px-4 rounded-xl font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #008CFF, #0070CC)' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.5 1.5H4.5A3 3 0 001.5 4.5v15a3 3 0 003 3h15a3 3 0 003-3v-15a3 3 0 00-3-3zm-2.25 5.25c0 3.315-2.835 7.845-5.25 10.5-2.145-2.43-3.135-4.95-3.135-6.99 0-1.725.765-3.51 2.49-3.51.9 0 1.725.54 2.25 1.35.525-.81 1.35-1.35 2.25-1.35.9 0 1.395.54 1.395 0z"/>
          </svg>
          Pay $10 via Venmo @{VENMO_USERNAME}
        </a>
      )}

      {/* Already paid message */}
      {!isPaidOut && currentUser && currentUserPaid && (
        <div className="flex items-center justify-center gap-2 w-full mb-2 py-3 px-4 rounded-xl bg-green-900/40 border border-green-700/50 text-green-300 font-semibold">
          ✓ You're paid in — good luck!
        </div>
      )}

      {/* Breakdown */}
      <div className="bg-f1-dark rounded-lg p-3 mb-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Buy-in per player</span>
          <span className="font-semibold text-white">$10</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Goes to prize pool</span>
          <span className="font-semibold text-yellow-400">$9 per player</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">
            $1 optional tip to the developer 🛠️{' '}
            <a
              href={`https://venmo.com/u/${VENMO_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              @{VENMO_USERNAME}
            </a>
          </span>
          <span className="text-gray-500 text-xs">${hostTotal.toFixed(0)} total</span>
        </div>
        <div className="border-t border-gray-700 pt-1.5 flex justify-between">
          <span className="text-gray-400">Total collected so far</span>
          <span className="font-bold text-white">${totalCollected.toFixed(0)}</span>
        </div>
      </div>

      {/* Who's paid */}
      {users.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Who's in</p>
          <div className="flex flex-wrap gap-2">
            {users.map(user => {
              const paid = paidIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    paid
                      ? 'bg-green-800/40 text-green-300 border border-green-700/50'
                      : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}
                >
                  <span>{user.emoji}</span>
                  <span>{user.name.split(' ')[0]}</span>
                  <span>{paid ? '✓' : '·'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Winner display */}
      {isPaidOut && pot?.winner_user_ids?.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
          <p className="text-xs text-yellow-400 mb-1">🏆 Winner{pot.winner_user_ids.length > 1 ? 's' : ''}</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {pot.winner_user_ids.map(wid => {
              const w = users.find(u => u.id === wid);
              return w ? (
                <span key={wid} className="font-bold text-yellow-300">
                  {w.emoji} {w.name} — ${parseFloat(pot.prize_per_winner).toFixed(2)}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PotCard;
