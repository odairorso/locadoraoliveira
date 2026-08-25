import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeModel = 'gold_minimal' | 'vibrant_multicolor';

interface ThemeContextType {
  themeModel: ThemeModel;
  setThemeModel: (theme: ThemeModel) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeModel, setThemeModelState] = useState<ThemeModel>(() => {
    const saved = localStorage.getItem('oliveira_theme_model') as ThemeModel;
    return saved === 'vibrant_multicolor' || saved === 'gold_minimal' ? saved : 'gold_minimal';
  });

  const setThemeModel = (theme: ThemeModel) => {
    setThemeModelState(theme);
    localStorage.setItem('oliveira_theme_model', theme);
  };

  return (
    <ThemeContext.Provider value={{ themeModel, setThemeModel }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
