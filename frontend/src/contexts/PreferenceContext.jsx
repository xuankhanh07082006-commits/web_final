import { createContext, useContext, useEffect, useState } from "react";

const PreferenceContext = createContext();

export const PreferenceProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [fontSize, setFontSize] = useState(() => {
    return Number(localStorage.getItem("fontSize")) || 16;
  });
  useEffect(() => {
    const body = document.body;

    if (theme === "dark") {
      body.classList.add("dark-mode");
    } else {
      body.classList.remove("dark-mode");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size",
      `${fontSize}px`
    );
    document.documentElement.style.zoom = parseInt(fontSize) / 16;

    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const changeFontSize = (size) => {
    setFontSize(size);
  };

  return (
    <PreferenceContext.Provider
      value={{
        theme,
        fontSize,
        toggleTheme,
        changeFontSize,
      }}
    >
      {children}
    </PreferenceContext.Provider>
  );
};
export const usePreference = () => {
  return useContext(PreferenceContext);
};