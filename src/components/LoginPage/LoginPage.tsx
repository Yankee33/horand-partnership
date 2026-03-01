import React, { useState } from "react";
import "./LoginPage.css";
import logo from "../../icons/box.png";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LangSwitcher } from "../LangSwitcher/LangSwitcher";
import { authApi, setToken } from "../../api/Api";
import { useAppContext } from "../../context/AppContext";

interface LoginErrors {
  email?: string;
  password?: string;
  server?: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setCurrentUser } = useAppContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const validate = (e: string, p: string): LoginErrors => {
    const errs: LoginErrors = {};
    if (!e.trim()) errs.email = t("login.errors.usernameRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errs.email = t("login.errors.emailInvalid");
    if (!p) errs.password = t("login.errors.passwordRequired");
    else if (p.length < 6) errs.password = t("login.errors.passwordMin");
    return errs;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(email, password));
  };

  const handleLogin = async () => {
    const errs = validate(email, password);
    setTouched({ email: true, password: true });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { access_token } = await authApi.login({ email, password });
      setToken(access_token);
      const user = await authApi.me();
      setCurrentUser(user);
      navigate("/distribution");
    } catch (err: any) {
      setErrors({ server: err.message || "Невірний email або пароль" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-header">
        <img className="login-logo" src={logo} alt="logo" />
        <div>
          <div className="login-brand-name">{t("login.title")}</div>
          <p className="login-subtitle">{t("login.subtitle")}</p>
        </div>
        <LangSwitcher />
      </div>

      <div className="login-card">
        {errors.server && (
          <div className="server-error">{errors.server}</div>
        )}

        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            className={`input-field${touched.email && errors.email ? " input-error" : ""}`}
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(validate(e.target.value, password)); }}
            onBlur={() => handleBlur("email")}
          />
          {touched.email && errors.email && <span className="error-msg">{errors.email}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">{t("login.password")}</label>
          <input
            className={`input-field${touched.password && errors.password ? " input-error" : ""}`}
            type="password"
            placeholder={t("login.passwordPlaceholder")}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors(validate(email, e.target.value)); }}
            onBlur={() => handleBlur("password")}
          />
          {touched.password && errors.password && <span className="error-msg">{errors.password}</span>}
        </div>

        <button className="forgot-password">{t("login.forgotPassword")}</button>

        <button className="login-button" onClick={handleLogin} disabled={loading}>
          {loading ? "..." : t("login.loginBtn")}
        </button>

        <p className="or-divider">{t("login.orContinue")}</p>

        <div className="social-buttons">
          <button className="social-btn" aria-label="Google">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>
          <button className="social-btn" aria-label="Facebook">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
            </svg>
          </button>
          <button className="social-btn" aria-label="Apple">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#000000"/>
            </svg>
          </button>
        </div>
      </div>

      <p className="signup-text">
        {t("login.noAccount")}{" "}
        <button onClick={() => navigate("/register")} className="signup-link">{t("login.signUp")}</button>
      </p>
    </div>
  );
};