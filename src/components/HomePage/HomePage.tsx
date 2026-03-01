import React from "react";
import "./HomePage.css";
import logo from "../../icons/logo.png";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LangSwitcher } from "../LangSwitcher/LangSwitcher";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="page-wrapper">
      <div className="header">
        <span>
          <img className="logo-icon" src={logo} alt="logo" />
        </span>
        <div className="brand-name">
          HORAND
          <br />
          Partnership
        </div>
        <LangSwitcher />
      </div>

      <div className="hero-section">
        <h1 className="hero-title">{t("home.title")}</h1>
        <p className="hero-description">{t("home.description")}</p>
      </div>

      <button className="cta-button" onClick={() => navigate("/login")}>
        {t("home.getStarted")}
      </button>

      <p className="footer-text">{t("home.footer")}</p>
    </div>
  );
};