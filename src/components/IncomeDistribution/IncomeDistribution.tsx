import React, { useState } from "react";
import "./IncomeDistribution.css";
import { useNavigate } from "react-router-dom";
import { useAppContext, CoOwner } from "../../context/AppContext";
import { useTranslation } from "react-i18next";
import { companiesApi } from "../../api/Api";

interface DistributionErrors {
  projectName?: string;
  totalShare?: string;
  server?: string;
  owners: Record<number, { name?: string; share?: string }>;
}

export const IncomeDistribution: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { distribution, setDistribution, setCompanyId } = useAppContext();

  const [type, setType] = useState<"company" | "project">(distribution.type);
  const [projectName, setProjectName] = useState(distribution.projectName);
  const [coOwners, setCoOwners] = useState<CoOwner[]>(distribution.coOwners);
  const [errors, setErrors] = useState<DistributionErrors>({ owners: {} });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (name: string, owners: CoOwner[]): DistributionErrors => {
    const errs: DistributionErrors = { owners: {} };
    if (!name.trim()) errs.projectName = t("distribution.errors.nameRequired");
    owners.forEach((o) => {
      const ownerErrs: { name?: string; share?: string } = {};
      if (!o.name.trim()) ownerErrs.name = t("distribution.errors.ownerNameRequired");
      const shareNum = Number(o.share);
      if (!o.share) ownerErrs.share = t("distribution.errors.shareRequired");
      else if (isNaN(shareNum) || shareNum < 1 || shareNum > 99)
        ownerErrs.share = t("distribution.errors.shareRange");
      if (Object.keys(ownerErrs).length > 0) errs.owners[o.id] = ownerErrs;
    });
    const total = owners.reduce((sum, o) => sum + (Number(o.share) || 0), 0);
    if (total !== 100) errs.totalShare = t("distribution.errors.totalShare", { total });
    return errs;
  };

  const hasErrors = (errs: DistributionErrors) =>
    !!errs.projectName || !!errs.totalShare || Object.keys(errs.owners).length > 0;

  const handleContinue = async () => {
    setSubmitted(true);
    const errs = validate(projectName, coOwners);
    setErrors(errs);
    if (hasErrors(errs)) return;

    setLoading(true);
    try {
      // Зберігаємо компанію на сервері
      const company = await companiesApi.create({
        name: projectName,
        entity_type: type,
        co_owners: coOwners.map((o, i) => ({
          full_name: o.name,
          share: Number(o.share),
          position: i + 1,
        })),
        income_rules: [],
      });

      // Зберігаємо фото якщо є
      for (const owner of coOwners) {
        if (owner.photo) {
          const serverOwner = company.co_owners.find((co) => co.position === coOwners.indexOf(owner) + 1);
          if (serverOwner) {
            const { photo_url } = await companiesApi.uploadPhoto(company.id, serverOwner.id, owner.photo);
            owner.photoUrl = photo_url;
            owner.serverId = serverOwner.id;
          }
        } else {
          const serverOwner = company.co_owners.find((co) => co.position === coOwners.indexOf(owner) + 1);
          if (serverOwner) owner.serverId = serverOwner.id;
        }
      }

      setCompanyId(company.id);
      setDistribution({ type, projectName, coOwners });
      navigate("/income-types");
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, server: err.message || "Помилка збереження" }));
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (id: number, value: string) => {
    const updated = coOwners.map((o) => (o.id === id ? { ...o, name: value } : o));
    setCoOwners(updated);
    if (submitted) setErrors(validate(projectName, updated));
  };

  const handleShareChange = (id: number, value: string) => {
    const updated = coOwners.map((o) => (o.id === id ? { ...o, share: value } : o));
    setCoOwners(updated);
    if (submitted) setErrors(validate(projectName, updated));
  };

  const handlePhotoChange = (id: number, file: File | null) => {
    setCoOwners((prev) => prev.map((o) => (o.id === id ? { ...o, photo: file } : o)));
  };

  const handleProjectNameChange = (value: string) => {
    setProjectName(value);
    if (submitted) setErrors(validate(value, coOwners));
  };

  const addCoOwner = () => {
    const newId = Date.now();
    const updated = [...coOwners, { id: newId, name: "", share: "", photo: null }];
    setCoOwners(updated);
    if (submitted) setErrors(validate(projectName, updated));
  };

  const ordinal = (n: number) => {
    const words = ["першого", "Другого", "Третього", "Четвертого", "П'ятого"];
    return words[n - 1] ?? `${n}-го`;
  };

  const totalShare = coOwners.reduce((sum, o) => sum + (Number(o.share) || 0), 0);

  return (
    <div className="distribution-wrapper">
      <div className="radio-group">
        <label className="radio-label">
          <input type="radio" name="type" checked={type === "company"} onChange={() => setType("company")} />
          {t("distribution.companyName")}
        </label>
        <label className="radio-label">
          <input type="radio" name="type" checked={type === "project"} onChange={() => setType("project")} />
          {t("distribution.projectName")}
        </label>
      </div>

      <div className="field-group">
        <label className="field-label">{t("distribution.enterName")}</label>
        <input
          className={`field-input${submitted && errors.projectName ? " input-error" : ""}`}
          type="text" placeholder={t("distribution.namePlaceholder")} value={projectName}
          onChange={(e) => handleProjectNameChange(e.target.value)}
        />
        {submitted && errors.projectName && <span className="error-msg">{errors.projectName}</span>}
      </div>

      {coOwners.map((owner, index) => (
        <div className="coowner-block" key={owner.id}>
          <div className="field-group">
            <label className="field-label">{t("distribution.ownerName", { position: ordinal(index + 1) })}</label>
            <input
              className={`field-input${submitted && errors.owners[owner.id]?.name ? " input-error" : ""}`}
              type="text" placeholder={t("distribution.ownerNamePlaceholder")} value={owner.name}
              onChange={(e) => handleNameChange(owner.id, e.target.value)}
            />
            {submitted && errors.owners[owner.id]?.name && (
              <span className="error-msg">{errors.owners[owner.id].name}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">{t("distribution.ownerShare", { position: ordinal(index + 1) })}</label>
            <input
              className={`field-input${submitted && errors.owners[owner.id]?.share ? " input-error" : ""}`}
              type="number" min={1} max={99} placeholder={t("distribution.ownerSharePlaceholder")} value={owner.share}
              onChange={(e) => handleShareChange(owner.id, e.target.value)}
            />
            {submitted && errors.owners[owner.id]?.share && (
              <span className="error-msg">{errors.owners[owner.id].share}</span>
            )}
          </div>

          <input type="file" accept="image/*" id={`photo-${owner.id}`} style={{ display: "none" }}
            onChange={(e) => handlePhotoChange(owner.id, e.target.files?.[0] ?? null)} />
          <button className="photo-btn" onClick={() => document.getElementById(`photo-${owner.id}`)?.click()}>
            {owner.photo ? t("common.photoAdded") : t("common.addPhoto")}
          </button>
        </div>
      ))}

      <div className={`share-total${totalShare === 100 ? " share-total--valid" : ""}`}>
        {t("distribution.totalShare")} <strong>{totalShare}%</strong> / 100%
      </div>
      {submitted && errors.totalShare && <span className="error-msg error-msg--block">{errors.totalShare}</span>}
      {submitted && errors.server && <span className="error-msg error-msg--block">{errors.server}</span>}

      <button className="add-coowner-btn" onClick={addCoOwner}>{t("distribution.addOwner")}</button>
      <button className="continue-btn" onClick={handleContinue} disabled={loading}>
        {loading ? "..." : t("common.continue")}
      </button>
    </div>
  );
};