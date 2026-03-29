import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const { user, company } = JSON.parse(stored);
      setUser(user);
      setCompany(company);
    }
    setLoading(false);
  }, []);

  function persist(data) {
    localStorage.setItem('auth', JSON.stringify(data));
    setUser(data.user);
    setCompany(data.company);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data);
  }

  async function signup(payload) {
    const { data } = await api.post('/auth/signup', payload);
    persist(data);
  }

  function logout() {
    localStorage.removeItem('auth');
    setUser(null);
    setCompany(null);
  }

  return (
    <AuthContext.Provider value={{ user, company, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);