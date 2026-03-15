import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import UserSelector from './UserSelector';
import { verifyPin } from '../lib/api';

function PinEntry({ user, onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleKey = async (digit) => {
    if (checking) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');
    if (newPin.length === 4) {
      setChecking(true);
      const ok = await verifyPin(user.id, newPin);
      if (ok) {
        onSuccess();
      } else {
        setError('Wrong PIN, try again');
        setPin('');
      }
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-f1-dark flex flex-col items-center justify-center p-4">
      <div className="bg-f1-gray rounded-2xl p-8 w-80 shadow-2xl text-center">
        <span className="text-5xl">{user.emoji}</span>
        <h2 className="text-xl font-bold text-white mt-3">{user.name}</h2>
        <p className="text-gray-400 text-sm mt-1 mb-6">Enter your 4-digit PIN</p>

        <div className="flex justify-center gap-4 mb-4">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < pin.length ? 'bg-f1-red scale-110' : 'bg-gray-600'}`} />
          ))}
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handleKey(String(n))} disabled={checking}
              className="bg-f1-dark hover:bg-gray-700 text-white font-bold text-xl py-3 rounded-lg transition-colors disabled:opacity-50">
              {n}
            </button>
          ))}
          <div />
          <button onClick={() => handleKey('0')} disabled={checking}
            className="bg-f1-dark hover:bg-gray-700 text-white font-bold text-xl py-3 rounded-lg transition-colors disabled:opacity-50">
            0
          </button>
          <button onClick={() => setPin(p => { setError(''); return p.slice(0, -1); })} disabled={checking}
            className="bg-f1-dark hover:bg-gray-700 text-gray-400 font-bold text-xl py-3 rounded-lg transition-colors">
            ⌫
          </button>
        </div>

        <button onClick={onCancel} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
          ← Back
        </button>
      </div>
    </div>
  );
}

function LoginScreen() {
  const { users, selectUser, loading } = useUser();
  const [pinUser, setPinUser] = useState(null);

  const handleSelect = (user) => {
    if (user.has_pin) {
      setPinUser(user);
    } else {
      selectUser(user);
    }
  };

  if (pinUser) {
    return (
      <PinEntry
        user={pinUser}
        onSuccess={() => { selectUser(pinUser); setPinUser(null); }}
        onCancel={() => setPinUser(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-f1-dark flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-f1-red">F1</span> Family Betting
        </h1>
        <p className="text-gray-400">Who's playing today?</p>
      </div>

      {loading ? (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-f1-red" />
      ) : (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="bg-f1-gray hover:bg-gray-600 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 hover:shadow-xl hover:shadow-f1-red/10 border border-transparent hover:border-f1-red/30"
            >
              <span className="text-5xl">{user.emoji}</span>
              <span className="font-semibold text-white">{user.name}</span>
              {user.has_pin && <span className="text-xs text-gray-500">🔒 PIN required</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const { currentUser, clearUser, isHost } = useUser();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/predictions', label: 'Predictions' },
    { path: '/analysis', label: 'Analysis' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/history', label: 'History' },
    ...(isHost ? [{ path: '/admin', label: 'Admin' }] : [])
  ];

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-f1-gray border-b-4 border-f1-red">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-f1-red font-bold text-2xl">F1</span>
              <span className="text-white font-semibold">Family Betting</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`transition-colors ${
                    location.pathname === item.path
                      ? 'text-f1-red font-semibold'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Current user + switch */}
            <div className="flex items-center gap-3">
              <span className="text-lg">{currentUser.emoji}</span>
              <span className="text-white font-medium hidden sm:block">{currentUser.name}</span>
              <button
                onClick={clearUser}
                className="text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-2 py-1 rounded transition-colors"
              >
                Switch
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-600">
          <div className="flex justify-around py-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1 text-sm ${
                  location.pathname === item.path
                    ? 'text-f1-red font-semibold'
                    : 'text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-f1-gray py-4 text-center text-gray-400 text-sm">
        F1 Family Betting App - Season {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default Layout;
