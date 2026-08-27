import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const dictionary = {
  en: {
    dashboard: "Dashboard",
    tasks: "Tasks",
    attendance: "Attendance",
    leave: "Leave",
    reports: "Reports",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    welcome: "Welcome back",
    activeTasks: "Active Tasks",
    completed: "Completed",
    inReview: "In Review",
    // Add more translations as needed
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    tasks: "টাস্ক সমূহ",
    attendance: "উপস্থিতি",
    leave: "ছুটি",
    reports: "রিপোর্টস",
    profile: "প্রোফাইল",
    settings: "সেটিংস",
    logout: "লগআউট",
    welcome: "স্বাগতম",
    activeTasks: "সচল টাস্ক",
    completed: "সম্পন্ন",
    inReview: "রিভিউ চলছে",
    // Add more translations as needed
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('cca_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('cca_language', language);
    // Optionally set html lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return dictionary[language]?.[key] || dictionary['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
