import React, { useState } from "react";
import "./IncomeTypes.css";
import logo from "../../icons/box.png";
import { useNavigate } from "react-router-dom";
import { useAppContext, IncomeRule } from "../../context/AppContext";
import { useTranslation } from "react-i18next";
import { companiesApi } from "../../api/Api";

type IncomeTypeKey = "project" | "clients" | "profit";

export const IncomeTypes: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { distribution, companyId, setIncomeTypes } = useAppContext();
  const { coOwners } = distribution;

  const OPTIONS: { id: IncomeTypeKey; label: string }[] = [
    { id: "project", label: t("incomeTypes.project") },
    { id: "clients", label: t("incomeTypes.clients") },
    { id: "profit",  label: t("incomeTypes.profit") },
  ];

  const [openPanels, setOpenPanels] = useState<IncomeTypeKey[]>([]);
  const [shares, setShares] = useState<Record<IncomeTypeKey, Record<number, string>>>({
    project: {}, clients: {}, profit: {},
  });
  const [errors, setErrors] = useState<Record<IncomeTypeKey, string | null>>({
    project: null, clients: null, profit: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const togglePanel = (id: IncomeTypeKey) => {
    setOpenPanels((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleShareChange = (type: IncomeTypeKey, ownerId: number, value: string) => {
    const updated = { ...shares, [type]: { ...shares[type], [ownerId]: value } };
    setShares(updated);
    if (submitted) validateType(type, updated[type]);
  };

  const validateType = (type: IncomeTypeKey, typeShares: Record<number, string>): boolean => {
    if (!openPanels.includes(type)) return true;
    const total = coOwners.reduce((sum, o) => sum + (Number(typeShares[o.id]) || 0), 0);
    if (total !== 100) {
      setErrors((prev) => ({ ...prev, [type]: t("incomeTypes.errors.totalShare", { total }) }));
      return false;
    }
    setErrors((prev) => ({ ...prev, [type]: null }));
    return true;
  };

  const handleContinue = async () => {
    setSubmitted(true);
    if (openPanels.length === 0) { alert(t("incomeTypes.selectAtLeastOne")); return; }

    let valid = true;
    openPanels.forEach((type) => { if (!validateType(type, shares[type])) valid = false; });
    if (!valid) return;

    const toRules = (type: IncomeTypeKey): IncomeRule[] =>
      openPanels.includes(type)
        ? coOwners.map((o) => ({ ownerId: o.id, share: shares[type][o.id] || "0" }))
        : [];

    const newIncomeTypes = {
      project: toRules("project"),
      clients: toRules("clients"),
      profit: toRules("profit"),
    };

    setLoading(true);
    setServerError(null);

    try {
      if (companyId) {
        // Збираємо правила для API
        const apiRules: { co_owner_id: number; income_type: string; share: number }[] = [];
        openPanels.forEach((type) => {
          coOwners.forEach((o) => {
            if (o.serverId) {
              apiRules.push({
                co_owner_id: o.serverId,
                income_type: type,
                share: Number(shares[type][o.id] || 0),
              });
            }
          });
        });
        await companiesApi.updateIncomeRules(companyId, apiRules);
      }

      setIncomeTypes(newIncomeTypes);
      navigate("/summary");
    } catch (err: any) {
      setServerError(err.message || "Помилка збереження");
    } finally {
      setLoading(false);
    }
  };

  const getTotal = (type: IncomeTypeKey) =>
    coOwners.reduce((sum, o) => sum + (Number(shares[type][o.id]) || 0), 0);

  return (
    <div className="income-types-wrapper">
      <div className="income-types-card">
        <img className="income-types-logo" src={logo} alt="logo" />
        <h2 className="income-types-title">{t("incomeTypes.title")}</h2>

        <div className="income-options">
          {OPTIONS.map((opt) => {
            const isOpen = openPanels.includes(opt.id);
            const total = getTotal(opt.id);
            return (
              <div key={opt.id} className="accordion-item">
                <button className={`income-option-btn${isOpen ? " selected" : ""}`} onClick={() => togglePanel(opt.id)}>
                  <span>{opt.label}</span>
                  <span className="accordion-arrow">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="accordion-body">
                    {coOwners.map((owner) => (
                      <div className="accordion-row" key={owner.id}>
                        <span className="accordion-owner-name">{owner.name || `Співвласник ${owner.id}`}</span>
                        <div className="accordion-input-wrap">
                          <input
                            className={`accordion-input${submitted && errors[opt.id] ? " input-error" : ""}`}
                            type="number" min={0} max={100} placeholder="0"
                            value={shares[opt.id][owner.id] ?? ""}
                            onChange={(e) => handleShareChange(opt.id, owner.id, e.target.value)}
                          />
                          <span className="accordion-percent">%</span>
                        </div>
                      </div>
                    ))}
                    <div className={`accordion-total${total === 100 ? " valid" : ""}`}>
                      {t("incomeTypes.sum")} <strong>{total}%</strong> / 100%
                    </div>
                    {submitted && errors[opt.id] && <span className="error-msg">{errors[opt.id]}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {serverError && <div className="server-error" style={{ margin: "12px 0" }}>{serverError}</div>}

        <div className="income-types-footer">
          <button className="income-continue-btn" onClick={handleContinue} disabled={loading}>
            {loading ? "..." : t("common.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};