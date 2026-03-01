import React from "react";
import "./SummaryPage.css";
import logo from "../../icons/logo.png";
import { useNavigate } from "react-router-dom";
import { useAppContext, CoOwner, IncomeRule } from "../../context/AppContext";
import { useTranslation } from "react-i18next";
import bell from '../../icons/bell.png';
import home from '../../icons/home.png';
import dashboard from '../../icons/dashboard.png';
import add from '../../icons/add.png';
import inventory from '../../icons/inventory.png';
import profile from '../../icons/profile.png';
import loop from '../../icons/loop.png';

const getPhotoUrl = (photo: File | null): string | null => {
  if (!photo) return null;
  return URL.createObjectURL(photo);
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0]?.toUpperCase() ?? "?";
};

interface IncomeRowProps { label: string; value: number; }

const IncomeRow: React.FC<IncomeRowProps> = ({ label, value }) => (
  <div className="income-row">
    <div className="income-row-label">{label}</div>
    <div className="income-bar-wrap">
      <div className="income-bar-bg">
        <div className="income-bar-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="income-bar-value">{value}%</span>
    </div>
  </div>
);

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { distribution, incomeTypes, contractConfirmed } = useAppContext();
  const { coOwners, projectName } = distribution;

  const getShareForOwner = (rules: IncomeRule[], ownerId: number): number => {
    const rule = rules.find((r) => r.ownerId === ownerId);
    return Number(rule?.share ?? 0);
  };

  const buildPie = () => {
    const colors = ["#7b2fbe", "#c084fc", "#a855f7", "#9333ea"];
    let cumulative = 0;
    const stops = coOwners.map((o, i) => {
      const share = Number(o.share) || 0;
      const from = cumulative;
      cumulative += share;
      return `${colors[i % colors.length]} ${from}% ${cumulative}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  };

  return (
    <div className="summary-wrapper">
      <div className="summary-topbar">
        <img className="summary-topbar-logo" src={logo} alt="logo" />
        <span><img className="summary-topbar-bell" src={bell} alt="bell" /></span>
      </div>

      <h2 className="summary-title">{t("summary.title")}</h2>

      {contractConfirmed && (
        <div className="summary-search-bar">
          <span><img className="search-icon" src={loop} alt="" /></span>
        </div>
      )}

      {coOwners.map((owner: CoOwner, index: number) => {
        const photoUrl = getPhotoUrl(owner.photo);
        const projectShare = getShareForOwner(incomeTypes.project, owner.id);
        const clientsShare = getShareForOwner(incomeTypes.clients, owner.id);
        const profitShare = getShareForOwner(incomeTypes.profit, owner.id);

        return (
          <div className="owner-card" key={owner.id}>
            <span className="owner-number">{index + 1}</span>
            <div className="owner-card-header">
              {photoUrl ? (
                <img className="owner-avatar" src={photoUrl} alt={owner.name} />
              ) : (
                <div className="owner-avatar-placeholder">{getInitials(owner.name || "?")}</div>
              )}
              <div className="owner-info">
                <div className="owner-name">{owner.name || `Співвласник ${index + 1}`}</div>
                <div className="owner-company-share">
                  {t("summary.companyShare", { name: projectName, share: owner.share })}
                </div>
              </div>
            </div>
            {incomeTypes.project.length > 0 && (
              <IncomeRow label={t("summary.projectIncome", { name: projectName, share: projectShare })} value={projectShare} />
            )}
            {incomeTypes.clients.length > 0 && (
              <IncomeRow label={t("summary.clientsIncome", { share: clientsShare })} value={clientsShare} />
            )}
            {incomeTypes.profit.length > 0 && (
              <IncomeRow label={t("summary.profitIncome", { share: profitShare })} value={profitShare} />
            )}
          </div>
        );
      })}

      {!contractConfirmed && (
        <div className="summary-bottom">
          <span className="summary-company-name">{t("summary.company", { name: projectName })}</span>
          <div className="summary-avatars">
            {coOwners.slice(0, 1).map((o) => {
              const url = getPhotoUrl(o.photo);
              return url ? (
                <img key={o.id} className="summary-avatar" src={url} alt={o.name} />
              ) : (
                <div key={o.id} className="summary-avatar-placeholder">{getInitials(o.name || "?")}</div>
              );
            })}
            <div className="summary-pie" style={{ background: buildPie() }} />
            {coOwners.slice(1).map((o) => {
              const url = getPhotoUrl(o.photo);
              return url ? (
                <img key={o.id} className="summary-avatar" src={url} alt={o.name} />
              ) : (
                <div key={o.id} className="summary-avatar-placeholder">{getInitials(o.name || "?")}</div>
              );
            })}
          </div>
        </div>
      )}

      <button className="summary-continue-btn" onClick={() => navigate(contractConfirmed ? "/distribution" : "/contract")}>
        {contractConfirmed ? t("common.makeChanges") : t("common.continue")}
      </button>

      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate("/")}>
          <span className="nav-icon"><img src={home} alt="home" /></span>
          {t("common.nav.home")}
        </button>
        {contractConfirmed ? (
          <button className="nav-item" onClick={() => navigate("/summary")}>
            <span className="nav-icon"><img src={dashboard} alt="partners" /></span>
            {t("common.nav.partners")}
          </button>
        ) : (
          <button className="nav-item active" onClick={() => navigate("/summary")}>
            <span className="nav-icon"><img src={dashboard} alt="dashboard" /></span>
            {t("common.nav.dashboard")}
          </button>
        )}
        <button className="nav-add" onClick={() => navigate("/distribution")}>
          <span className="nav-icon"><img src={add} alt="add" /></span>
          {t("common.nav.add")}
        </button>
        {contractConfirmed ? (
          <button className="nav-item" onClick={() => navigate("/contract")}>
            <span className="nav-icon"><img src={inventory} alt="agreement" /></span>
            {t("common.nav.agreement")}
          </button>
        ) : (
          <button className="nav-item" onClick={() => navigate("/income-types")}>
            <span className="nav-icon"><img src={inventory} alt="inventory" /></span>
            {t("common.nav.inventory")}
          </button>
        )}
        <button className="nav-item" onClick={() => navigate("/login")}>
          <span className="nav-icon"><img src={profile} alt="profile" /></span>
          {t("common.nav.profile")}
        </button>
      </nav>
    </div>
  );
};