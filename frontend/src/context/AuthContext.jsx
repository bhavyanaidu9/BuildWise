import React, { createContext, useContext, useState } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bc_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to authenticate');
    }

    const data = await res.json();
    const newUser = {
      email,
      name: data.name,
      role: data.role,
      token: data.access_token,
    };

    setUser(newUser);
    localStorage.setItem('bc_user', JSON.stringify(newUser));
    return newUser;
  };

  const signup = async (name, email, phone, password, role) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phone, password, role }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to register account');
    }

    return await res.json();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bc_user');
  };

  const apiRequest = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = user?.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      logout();
    }

    return res;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, apiRequest, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
