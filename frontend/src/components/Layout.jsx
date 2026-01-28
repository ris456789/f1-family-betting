import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import UserSelector from './UserSelector';

function Layout({ children }) {
  const location = useLocation();
  const { isHost } = useUser();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/history', label: 'History' },
    ...(isHost ? [{ path: '/admin', label: 'Admin' }] : [])
  ];

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

            {/* User Selector */}
            <UserSelector />
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
