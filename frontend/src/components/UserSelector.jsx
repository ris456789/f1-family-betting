import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { verifyPin } from '../lib/api';

function PinModal({ user, onSuccess, onCancel }) {
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

  const handleBackspace = () => {
    setPin(p => p.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-f1-gray rounded-2xl p-6 w-72 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <span className="text-4xl">{user.emoji}</span>
          <p className="text-white font-bold mt-2">{user.name}</p>
          <p className="text-gray-400 text-sm">Enter your 4-digit PIN</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length ? 'bg-f1-red scale-110' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center mb-3">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button
              key={n}
              onClick={() => handleKey(String(n))}
              disabled={checking}
              className="bg-f1-dark hover:bg-gray-700 text-white font-bold text-xl py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {n}
            </button>
          ))}
          <div /> {/* empty cell */}
          <button
            onClick={() => handleKey('0')}
            disabled={checking}
            className="bg-f1-dark hover:bg-gray-700 text-white font-bold text-xl py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={checking}
            className="bg-f1-dark hover:bg-gray-700 text-gray-400 font-bold text-xl py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            ⌫
          </button>
        </div>

        <button onClick={onCancel} className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function UserSelector() {
  const { users, currentUser, selectUser, createUser, updateUser, loading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [pinUser, setPinUser] = useState(null);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newIsHost, setNewIsHost] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [createError, setCreateError] = useState('');

  const handleSelectUser = (user) => {
    if (user.has_pin) {
      setIsOpen(false);
      setPinUser(user);
    } else {
      selectUser(user);
      setIsOpen(false);
    }
  };

  const handlePinSuccess = () => {
    selectUser(pinUser);
    setPinUser(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreateError('');

    try {
      const makeHost = newIsHost || users.length === 0;
      const user = await createUser(newName.trim(), newEmoji || '👤', makeHost, newEmail || null);
      selectUser(user);
      setNewName('');
      setNewEmoji('');
      setNewEmail('');
      setNewIsHost(false);
      setShowCreate(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
      setCreateError(error.message || 'Failed to create player. Check Supabase is connected.');
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await updateUser(currentUser.id, {
        email: editEmail || null,
        notify_qualifying: !!editEmail
      });
      setShowEditEmail(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update email:', error);
    }
  };

  const openEditEmail = () => {
    setEditEmail(currentUser?.email || '');
    setShowEditEmail(true);
  };

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <>
      {pinUser && (
        <PinModal
          user={pinUser}
          onSuccess={handlePinSuccess}
          onCancel={() => setPinUser(null)}
        />
      )}

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-f1-dark px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          {currentUser ? (
            <>
              <span className="text-xl">{currentUser.emoji}</span>
              <span>{currentUser.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Select User</span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-f1-gray rounded-lg shadow-xl z-50 overflow-hidden">
            {showEditEmail ? (
              <form onSubmit={handleUpdateEmail} className="p-4">
                <p className="text-sm font-semibold mb-3">Email Notifications</p>
                <p className="text-xs text-gray-400 mb-3">
                  Get notified before qualifying sessions
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email address"
                    className="input w-full"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowEditEmail(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      Save
                    </button>
                  </div>
                </div>
              </form>
            ) : showCreate ? (
              <form onSubmit={handleCreateUser} className="p-4">
                <p className="text-sm font-semibold mb-3">New Player</p>
                <div className="space-y-3">
                  {createError && (
                    <p className="text-red-400 text-xs bg-red-900/30 p-2 rounded">{createError}</p>
                  )}
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Name *"
                    className="input w-full"
                    autoFocus
                    required
                  />
                  <input
                    type="text"
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    placeholder="Emoji (optional, e.g. 🏎️)"
                    className="input w-full"
                    maxLength={2}
                  />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email (for notifications)"
                    className="input w-full"
                  />
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsHost}
                      onChange={(e) => setNewIsHost(e.target.checked)}
                      className="rounded border-gray-600 bg-f1-dark text-f1-red focus:ring-f1-red"
                    />
                    <span>Make host <span className="text-gray-500">(admin access)</span></span>
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => { setShowCreate(false); setCreateError(''); }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      Create
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <div className="p-2">
                  <p className="text-xs text-gray-400 px-2 mb-2">Select Player</p>
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-f1-dark transition-colors ${
                        currentUser?.id === user.id ? 'bg-f1-dark' : ''
                      }`}
                    >
                      <span className="text-xl">{user.emoji}</span>
                      <span className="flex-1 text-left">{user.name}</span>
                      {user.has_pin && (
                        <span className="text-xs text-gray-500">🔒</span>
                      )}
                      {user.is_host && (
                        <span className="text-xs bg-f1-red px-1.5 py-0.5 rounded">Host</span>
                      )}
                      {currentUser?.id === user.id && (
                        <svg className="w-4 h-4 text-f1-red" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-600 p-2 space-y-1">
                  {currentUser && (
                    <button
                      onClick={openEditEmail}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-gray-300 hover:bg-f1-dark rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{currentUser.email ? 'Edit Email' : 'Add Email'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-f1-red hover:bg-f1-dark rounded transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Player</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default UserSelector;
