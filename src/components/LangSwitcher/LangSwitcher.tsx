import React from "react";
import { useTranslation } from "react-i18next";
import "./LangSwitcher.css";

export const LangSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const toggle = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <div className="lang-switcher">
      <button
        className={`lang-btn${current === "ua" ? " active" : ""}`}
        onClick={() => toggle("ua")}
      >
        UA
      </button>
      <span className="lang-divider">|</span>
      <button
        className={`lang-btn${current === "en" ? " active" : ""}`}
        onClick={() => toggle("en")}
      >
        EN
      </button>
    </div>
  );
};