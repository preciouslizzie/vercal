import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import API from '../api/api';

const StateContext = createContext();

const initialState = {
  chat: false,
  cart: false,
  userProfile: false,
  notification: false,
};

export const ContextProvider = ({ children }) => {
  // ================= UI STATE =================
  const [screenSize, setScreenSize] = useState(undefined);
  const [currentColor, setCurrentColor] = useState('#03C9D7');
  const [currentMode, setCurrentMode] = useState('Light');
  const [themeSettings, setThemeSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState(true);
  const [isClicked, setIsClicked] = useState(initialState);

  // ================= AUTH STATE =================
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // ================= UI METHODS =================
  const setMode = (e) => {
    setCurrentMode(e.target.value);
    localStorage.setItem('themeMode', e.target.value);
  };

  const setColor = (color) => {
    setCurrentColor(color);
    localStorage.setItem('colorMode', color);
  };

  const handleClick = (clicked) => setIsClicked({ ...initialState, [clicked]: true });

  // ================= AUTH METHODS (NEW) =================

  const register = async (payload) => {
    await API.post('/register', payload);
  };
  const login = async (credentials) => {
    const { data } = await API.post('/login', credentials);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const fetchProfile = async () => {
    try {
      const { data } = await API.get('/profile');
      setUser(data);
    } catch (err) {
      logout();
    }
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New order received',
      message: 'Order #3921 has been placed',
    },
    {
      id: 2,
      title: 'New user signup',
      message: 'A new user just registered',
    },
  ]);

  // Autoload user on refresh
  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
  }, [token]);

  const contextValue = useMemo(() => ({
    // UI
    currentColor,
    currentMode,
    activeMenu,
    screenSize,
    setScreenSize,
    handleClick,
    isClicked,
    initialState,
    setIsClicked,
    setActiveMenu,
    setCurrentColor,
    setCurrentMode,
    setMode,
    setColor,
    themeSettings,
    setThemeSettings,
    notifications,
    setNotifications,

    // AUTH
    user,
    token,
    login,
    register,
    logout,
    fetchProfile,
  }), [
    currentColor,
    currentMode,
    activeMenu,
    screenSize,
    isClicked,
    themeSettings,
    user,
    token,
  ]);

  return (
    <StateContext.Provider value={contextValue}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
