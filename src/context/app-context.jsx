"use client";

import { createContext, useContext, useState, useEffect } from 'react';

// 1. Создаем контекст
const AppContext = createContext(null);

/**
 * 2. Создаем провайдер
 * Он принимает начальные данные (initialUser, initialSections) от серверного компонента.
 * Внутри он использует useState, чтобы сделать эти данные изменяемыми на клиенте.
 */
export const AppProvider = ({ children, initialUser, initialSections, initialEvents }) => {
  const [user, setUser] = useState(initialUser);
  const [sections, setSections] = useState(initialSections);

  // Можно добавить и другие состояния, например, для событий
  const [events, setEvents] = useState(initialEvents);

  // Navigation state for current selected section/subsection
  const [currentSection, setCurrentSection] = useState(null);
  const [currentSubSection, setCurrentSubSection] = useState(null);

  // Оборачиваем значение в объект, чтобы передать и данные, и функции для их обновления
  const value = {
    user,
    setUser,
    sections,
    setSections,
    events,
    setEvents,
    currentSection,
    setCurrentSection,
    currentSubSection,
    setCurrentSubSection
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * 3. Создаем кастомный хук для удобного доступа к контексту
 * Теперь он будет называться useAppContext
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
