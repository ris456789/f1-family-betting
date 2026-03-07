import { createContext, useContext, useState, useEffect } from 'react';
import { getUsers, createUser as apiCreateUser, updateUser as apiUpdateUser } from '../lib/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Load saved user from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('f1betting_userId');
    if (savedUserId && users.length > 0) {
      const user = users.find(u => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('f1betting_userId', user.id);
  };

  const clearUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('f1betting_userId');
  };

  const createUser = async (name, emoji = '👤', is_host = false, email = null) => {
    try {
      const newUser = await apiCreateUser(name, emoji, is_host, email);
      setUsers([...users, newUser]);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const updatedUser = await apiUpdateUser(userId, updates);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
      }
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const isHost = currentUser?.is_host === true;

  return (
    <UserContext.Provider value={{
      users,
      currentUser,
      loading,
      isHost,
      selectUser,
      clearUser,
      createUser,
      updateUser,
      refreshUsers: fetchUsers
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
