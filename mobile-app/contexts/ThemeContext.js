import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'app_theme';

const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#6BBD9B',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#6BBD9B',
    warning: '#F59E0B',
    card: '#FFFFFF',
    input: '#F9FAFB',
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#8DD4B8',
    background: '#0F172A', // Mais claro que preto puro, melhor visibilidade
    surface: '#1E293B', // Mais claro para melhor contraste
    text: '#F1F5F9', // Texto mais claro e legível
    textSecondary: '#CBD5E1', // Texto secundário mais visível
    border: '#475569', // Bordas mais visíveis
    error: '#F87171',
    success: '#8DD4B8',
    warning: '#FBBF24',
    card: '#1E293B', // Cards com mais contraste
    input: '#334155', // Inputs mais claros e visíveis
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState(lightTheme);
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    applyTheme();
  }, [themeMode, systemTheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    }
  };

  const applyTheme = () => {
    if (themeMode === 'system') {
      setTheme(systemTheme === 'dark' ? darkTheme : lightTheme);
    } else {
      setTheme(themeMode === 'dark' ? darkTheme : lightTheme);
    }
  };

  const toggleTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

