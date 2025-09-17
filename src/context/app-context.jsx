"use client";

import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children, initialUser, initialSections, initialEvents }) => {
  const [user, setUser] = useState(initialUser);
  const [sections, setSections] = useState(initialSections);


  const [events, setEvents] = useState(initialEvents);

  const [currentSection, setCurrentSection] = useState(null);
  const [currentSubSection, setCurrentSubSection] = useState(null);


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

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
