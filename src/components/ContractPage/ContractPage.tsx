import React, { useState } from "react";
import "./ContractPage.css";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useTranslation } from "react-i18next";
import { LangSwitcher } from "../LangSwitcher/LangSwitcher";
import { companiesApi, getToken } from "../../api/Api";

export const ContractPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { distribution, incomeTypes, companyId, setContractConfirmed } = useAppContext();
  const { coOwners, projectName, type } = distribution;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUA = i18n.language === "ua";
  const companyLabel = isUA
    ? (type === "company" ? "Компанія" : "Проєкт")
    : (type === "company" ? "Company" : "Project");
  const companyShort = `«${projectName}»`;

  const getShare = (rules: { ownerId: number; share: string }[], ownerId: number) => {
    const r = rules.find((r) => r.ownerId === ownerId);
    return r ? `${r.share}%` : "—";
  };

  const ownerLabel = (i: number) => isUA ? `Співвласник ${i + 1}` : `Co-owner ${i + 1}`;

  const handleDownloadPdf = async () => {
    if (!companyId) return;
    const lang = i18n.language;
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
    const token = getToken();
    const res = await fetch(`${API_URL}/api/companies/${companyId}/contract/pdf?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract_${distribution.projectName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      if (companyId) {
        await companiesApi.update(companyId, { contract_confirmed: true });
      }
      setContractConfirmed(true);
      navigate("/summary");
    } catch (err: any) {
      setError(err.message || "Помилка підтвердження");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contract-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 0" }}>
        <h1 className="contract-main-title" style={{ padding: 0 }}>{t("contract.title")}</h1>
        <LangSwitcher />
      </div>

      <div className="contract-body">
        <p className="contract-doc-title">{t("contract.docTitle")}</p>

        <p className="contract-text">
          {isUA
            ? "Цей Договір про співвласність та розподіл доходів (надалі – «Договір») укладений [●] («Дата набрання чинності») між:"
            : `This Co-ownership and Income Distribution Agreement (the "Agreement") is entered into as of [●] (the "Effective Date") between:`}
        </p>

        {coOwners.map((o, i) => (
          <p className="contract-owner-line" key={o.id}>
            {i + 1}. {o.name} («{ownerLabel(i)}»)
          </p>
        ))}

        <p className="contract-text" style={{ marginTop: 8 }}>
          {isUA ? "(разом – «Сторони», а окремо – «Сторона»)." : `(together the "Parties" and each a "Party").`}
        </p>
        <p className="contract-text">
          {isUA ? "Сторони домовились про таке:" : "The Parties agree as follows:"}
        </p>

        <p className="contract-section-title">1. {companyLabel.toUpperCase()}</p>
        <p className="contract-subsection">
          {isUA
            ? `1.1. Сторони є співвласниками ${type === "company" ? "компанії" : "проєкту"} ${companyShort} (надалі – ${companyShort}).`
            : `1.1. The Parties are co-owners of the ${type === "company" ? "company" : "project"} ${companyShort} (the ${companyShort}).`}
        </p>
        <p className="contract-subsection">
          {isUA
            ? `1.2. Частки у власності на ${companyLabel} ${companyShort} розподіляються порівну:`
            : `1.2. Ownership shares in the ${companyLabel} ${companyShort} are distributed as follows:`}
        </p>
        {coOwners.map((o, i) => (
          <p className="contract-owner-line" key={o.id}>{ownerLabel(i)}: {o.share}%</p>
        ))}

        <p className="contract-section-title">
          {isUA ? "2. РОЗПОДІЛ ДОХОДІВ" : "2. INCOME DISTRIBUTION"}
        </p>
        <p className="contract-subsection">
          {isUA
            ? `Сторони домовляються про такий розподіл доходів та прибутків від діяльності ${companyLabel} ${companyShort} та її проєктів:`
            : `The Parties agree on the following distribution of income and profits from the activities of the ${companyLabel} ${companyShort}:`}
        </p>

        {incomeTypes.project.length > 0 && (
          <>
            <p className="contract-subsection">
              {isUA ? `2.1. Дохід від проєкту ${companyShort}` : `2.1. Income from project ${companyShort}`}
            </p>
            {coOwners.map((o, i) => (
              <p className="contract-owner-line" key={o.id}>{ownerLabel(i)}: {getShare(incomeTypes.project, o.id)}</p>
            ))}
          </>
        )}
        {incomeTypes.clients.length > 0 && (
          <>
            <p className="contract-subsection">
              {isUA ? `2.2. Дохід від перших 30 клієнтів ${companyLabel}` : `2.2. Income from first 30 clients of the ${companyLabel}`}
            </p>
            {coOwners.map((o, i) => (
              <p className="contract-owner-line" key={o.id}>{ownerLabel(i)}: {getShare(incomeTypes.clients, o.id)}</p>
            ))}
          </>
        )}
        {incomeTypes.profit.length > 0 && (
          <>
            <p className="contract-subsection">
              {isUA ? `2.3. Чистий прибуток ${companyLabel}` : `2.3. Net profit of the ${companyLabel}`}
            </p>
            {coOwners.map((o, i) => (
              <p className="contract-owner-line" key={o.id}>{ownerLabel(i)}: {getShare(incomeTypes.profit, o.id)}</p>
            ))}
          </>
        )}

        <p className="contract-section-title">
          {isUA ? "3. ПРАВА ТА ОБОВʼЯЗКИ" : "3. RIGHTS AND OBLIGATIONS"}
        </p>
        <p className="contract-subsection">
          {isUA
            ? `3.1. Кожна Сторона зобовʼязується діяти сумлінно та в найкращих інтересах ${companyLabel} ${companyShort}.`
            : `3.1. Each Party undertakes to act in good faith and in the best interests of the ${companyLabel} ${companyShort}.`}
        </p>
        <p className="contract-subsection">
          {isUA
            ? `3.2. Сторони мають рівні права щодо прийняття рішень стосовно управління, операцій та стратегії ${companyLabel}.`
            : `3.2. The Parties have equal rights regarding decisions on the management, operations and strategy of the ${companyLabel}.`}
        </p>
        <p className="contract-subsection">
          {isUA
            ? `3.3. Жодна зі Сторін не може брати на себе зобовʼязання від імені ${companyLabel}, що перевищують [●], без попередньої письмової згоди іншої Сторони.`
            : `3.3. Neither Party may assume obligations on behalf of the ${companyLabel} exceeding [●] without the prior written consent of the other Party.`}
        </p>

        <p className="contract-section-title">
          {isUA ? "4. СТРОК ДІЇ ТА ПРИПИНЕННЯ" : "4. TERM AND TERMINATION"}
        </p>
        <p className="contract-subsection">
          {isUA
            ? "4.1. Цей Договір діє до моменту його припинення за взаємною письмовою згодою Сторін."
            : "4.1. This Agreement shall remain in force until terminated by mutual written agreement of the Parties."}
        </p>
        <p className="contract-subsection">
          {isUA
            ? "4.2. У разі припинення Договору Сторони проводять остаточні розрахунки та розподіляють усі наявні прибутки чи збитки відповідно до встановлених часток."
            : "4.2. Upon termination, the Parties shall conduct a final accounting and distribute all remaining profits or losses in accordance with their respective shares."}
        </p>

        <p className="contract-section-title">
          {isUA ? "5. ЗАСТОСОВНЕ ПРАВО ТА ЮРИСДИКЦІЯ" : "5. GOVERNING LAW AND JURISDICTION"}
        </p>
        <p className="contract-subsection">
          {isUA
            ? "5.1. Цей Договір регулюється та тлумачиться відповідно до законодавства Англії та Уельсу."
            : "5.1. This Agreement shall be governed by and construed in accordance with the laws of England and Wales."}
        </p>
        <p className="contract-subsection">
          {isUA
            ? "5.2. Усі спори, що виникають із цього Договору або у звʼязку з ним, підлягають виключній юрисдикції судів Англії та Уельсу."
            : "5.2. Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts of England and Wales."}
        </p>

        <p className="contract-section-title">
          {isUA ? "6. ПОВНОТА ДОГОВОРУ" : "6. ENTIRE AGREEMENT"}
        </p>
        <p className="contract-subsection">
          {isUA
            ? "Цей Договір становить повне розуміння між Сторонами щодо його предмета та замінює собою всі попередні домовленості, угоди чи представлення."
            : "This Agreement constitutes the entire understanding between the Parties with respect to its subject matter and supersedes all prior agreements, understandings or representations."}
        </p>

        <p className="contract-section-title">
          {isUA ? "7. ПІДПИСИ" : "7. SIGNATURES"}
        </p>
        <div className="contract-signatures">
          {coOwners.map((o, i) => (
            <div className="contract-signature-block" key={o.id}>
              <span className="contract-signature-role">
                {isUA ? `Підпис Співвласника ${i + 1}:` : `Signature of Co-owner ${i + 1}:`}
              </span>
              <span className="contract-signature-name">
                {isUA ? `Імʼя: ${o.name}` : `Name: ${o.name}`}
              </span>
            </div>
          ))}
          <p className="contract-date-line">{isUA ? "Дата: ___________" : "Date: ___________"}</p>
        </div>

        <p className="contract-sign-label">{isUA ? "Підпис" : "Signature"}</p>
        <div className="contract-sign-box" />

        {error && <div className="server-error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      <div className="contract-footer">
        <button className="contract-export-btn" onClick={handleDownloadPdf} disabled={!companyId}>
          {i18n.language === "ua" ? "📄 Експорт PDF" : "📄 Export PDF"}
        </button>
        <button className="contract-confirm-btn" onClick={handleConfirm} disabled={loading}>
          {loading ? "..." : t("contract.confirmBtn")}
        </button>
      </div>
    </div>
  );
};