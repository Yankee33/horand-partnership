import React, { useState } from "react";
import "./RegisterPage.css";
import logo from "../../icons/logo.png";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LangSwitcher } from "../LangSwitcher/LangSwitcher";
import { authApi, setToken } from "../../api/Api";
import { useAppContext } from "../../context/AppContext";

interface RegisterErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  server?: string;
}

const getPasswordStrength = (p: string): "weak" | "medium" | "strong" | null => {
  if (!p) return null;
  const hasUpper = /[A-Z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecial = /[^A-Za-z0-9]/.test(p);
  if (p.length >= 8 && hasUpper && hasNumber && hasSpecial) return "strong";
  if (p.length >= 6 && (hasUpper || hasNumber)) return "medium";
  return "weak";
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setCurrentUser } = useAppContext();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const validate = (name: string, mail: string, pass: string, confirm: string): RegisterErrors => {
    const errs: RegisterErrors = {};
    if (!name.trim()) errs.fullName = t("register.errors.fullNameRequired");
    else if (name.trim().length < 3) errs.fullName = t("register.errors.fullNameMin");
    if (!mail.trim()) errs.email = t("register.errors.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) errs.email = t("register.errors.emailInvalid");
    if (!pass) errs.password = t("register.errors.passwordRequired");
    else if (pass.length < 6) errs.password = t("register.errors.passwordMin");
    if (!confirm) errs.confirmPassword = t("register.errors.confirmRequired");
    else if (confirm !== pass) errs.confirmPassword = t("register.errors.confirmMismatch");
    return errs;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(fullName, email, password, confirmPassword));
  };

  const handleChange = (field: string, value: string) => {
    if (field === "fullName") setFullName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);
    if (touched[field]) {
      const updated = { fullName, email, password, confirmPassword, [field]: value };
      setErrors(validate(updated.fullName, updated.email, updated.password, updated.confirmPassword));
    }
  };

  const handleRegister = async () => {
    const errs = validate(fullName, email, password, confirmPassword);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await authApi.register({ full_name: fullName, email, password });
      const { access_token } = await authApi.login({ email, password });
      setToken(access_token);
      const user = await authApi.me();
      setCurrentUser(user);
      navigate("/distribution");
    } catch (err: any) {
      setErrors({ server: err.message || "Помилка реєстрації" });
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="register-wrapper">
      <div className="register-header">
        <img className="register-logo" src={logo} alt="logo" />
        <div>
          <div className="register-brand-name">{t("register.title")}</div>
          <p className="register-subtitle">{t("register.subtitle")}</p>
        </div>
        <LangSwitcher />
      </div>

      <div className="register-card">
        {errors.server && <div className="server-error">{errors.server}</div>}

        <div className="input-group">
          <label className="input-label">{t("register.fullName")}</label>
          <input
            className={`input-field${touched.fullName && errors.fullName ? " input-error" : ""}`}
            type="text" placeholder={t("register.fullNamePlaceholder")} value={fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            onBlur={() => handleBlur("fullName")}
          />
          {touched.fullName && errors.fullName && <span className="error-msg">{errors.fullName}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">{t("register.email")}</label>
          <input
            className={`input-field${touched.email && errors.email ? " input-error" : ""}`}
            type="email" placeholder={t("register.emailPlaceholder")} value={email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
          />
          {touched.email && errors.email && <span className="error-msg">{errors.email}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">{t("register.password")}</label>
          <div className="password-wrap">
            <input
              className={`input-field${touched.password && errors.password ? " input-error" : ""}`}
              type={showPassword ? "text" : "password"} placeholder={t("register.passwordPlaceholder")} value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
            />
            <button className="password-toggle" onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          {password && (
            <>
              <div className="password-strength">
                <div className={`strength-bar ${strength === "weak" || strength === "medium" || strength === "strong" ? strength : ""}`} />
                <div className={`strength-bar ${strength === "medium" || strength === "strong" ? strength : ""}`} />
                <div className={`strength-bar ${strength === "strong" ? strength : ""}`} />
              </div>
              <span className={`strength-label ${strength ?? ""}`}>
                {strength ? t(`register.strength.${strength}`) : ""}
              </span>
            </>
          )}
          {touched.password && errors.password && <span className="error-msg">{errors.password}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">{t("register.confirmPassword")}</label>
          <div className="password-wrap">
            <input
              className={`input-field${touched.confirmPassword && errors.confirmPassword ? " input-error" : ""}`}
              type={showConfirm ? "text" : "password"} placeholder={t("register.confirmPasswordPlaceholder")} value={confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
            />
            <button className="password-toggle" onClick={() => setShowConfirm((p) => !p)} tabIndex={-1}>
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
        </div>

        <button className="register-button" onClick={handleRegister} disabled={loading}>
          {loading ? "..." : t("register.registerBtn")}
        </button>
      </div>

      <p className="login-text">
        {t("register.haveAccount")}{" "}
        <button className="login-link" onClick={() => navigate("/login")}>{t("register.signIn")}</button>
      </p>
    </div>
  );
};