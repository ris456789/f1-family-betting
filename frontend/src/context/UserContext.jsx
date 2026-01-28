import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
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

  const createUser = async (name, emoji = '👤', is_host = false) => {
    try {
      const response = await axios.post(`${API_URL}/users`, { name, emoji, is_host });
      setUsers([...users, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
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
