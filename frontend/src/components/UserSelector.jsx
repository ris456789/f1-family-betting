import { useState } from 'react';
import { useUser } from '../context/UserContext';

function UserSelector() {
  const { users, currentUser, selectUser, createUser, loading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newIsHost, setNewIsHost] = useState(false);

  // Check if there are any hosts already
  const hasHost = users.some(u => u.is_host);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      // Make first user the host automatically if no host exists
      const makeHost = newIsHost || (!hasHost && users.length === 0);
      const user = await createUser(newName.trim(), newEmoji || '👤', makeHost);
      selectUser(user);
      setNewName('');
      setNewEmoji('');
      setNewIsHost(false);
      setShowCreate(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
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
          {!showCreate ? (
            <>
              <div className="p-2">
                <p className="text-xs text-gray-400 px-2 mb-2">Select Player</p>
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      selectUser(user);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-f1-dark transition-colors ${
                      currentUser?.id === user.id ? 'bg-f1-dark' : ''
                    }`}
                  >
                    <span className="text-xl">{user.emoji}</span>
                    <span>{user.name}</span>
                    {user.is_host && (
                      <span className="text-xs bg-f1-red px-1.5 py-0.5 rounded">Host</span>
                    )}
                    {currentUser?.id === user.id && (
                      <svg className="w-4 h-4 text-f1-red ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-600 p-2">
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
          ) : (
            <form onSubmit={handleCreateUser} className="p-4">
              <p className="text-sm font-semibold mb-3">New Player</p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                  className="input w-full"
                  autoFocus
                />
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="Emoji (optional)"
                  className="input w-full"
                  maxLength={2}
                />
                {!hasHost && (
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newIsHost}
                      onChange={(e) => setNewIsHost(e.target.checked)}
                      className="rounded border-gray-600 bg-f1-dark text-f1-red focus:ring-f1-red"
                    />
                    <span>Make this player the host (admin)</span>
                  </label>
                )}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
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
          )}
        </div>
      )}
    </div>
  );
}

export default UserSelector;
