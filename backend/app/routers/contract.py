from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

from app.database import get_db
from app.models.models import User, Company, Agreement, AgreementStatus
from app.schemas.schemas import AgreementOut
from app.services.auth import get_current_user
from app.services.pdf_service import generate_contract_pdf
from app.config import settings

router = APIRouter(prefix="/api/companies", tags=["contract"])


def _get_company_or_404(company_id: int, user: User, db: Session) -> Company:
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.owner_id == user.id,
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/{company_id}/contract/pdf")
def download_contract_pdf(
    company_id: int,
    lang: str = "ua",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate contract PDF, save it locally and create/update Agreement record.
    Returns the PDF file as download.
    """
    company = _get_company_or_404(company_id, current_user, db)

    co_owners_data = [
        {"id": co.id, "full_name": co.full_name, "share": co.share, "position": co.position}
        for co in sorted(company.co_owners, key=lambda x: x.position)
    ]
    income_rules_data = [
        {"co_owner_id": rule.co_owner_id, "income_type": rule.income_type.value, "share": rule.share}
        for rule in company.income_rules
    ]

    try:
        pdf_bytes = generate_contract_pdf(
            company_name=company.name,
            entity_type=company.entity_type.value,
            co_owners=co_owners_data,
            income_rules=income_rules_data,
            lang=lang,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    # ── Save PDF to disk ──────────────────────────────
    agreements_dir = os.path.join(settings.UPLOAD_DIR, "agreements")
    os.makedirs(agreements_dir, exist_ok=True)

    # Version = number of existing agreements + 1
    existing_count = db.query(Agreement).filter(Agreement.company_id == company_id).count()
    version = existing_count + 1

    filename = f"contract_{company.name.replace(' ', '_')}_v{version}_{lang}.pdf"
    filepath = os.path.join(agreements_dir, filename)

    with open(filepath, "wb") as f:
        f.write(pdf_bytes)

    pdf_url = f"/uploads/agreements/{filename}"

    # ── Save Agreement record ─────────────────────────
    agreement = Agreement(
        company_id=company_id,
        version=version,
        status=AgreementStatus.confirmed if company.contract_confirmed else AgreementStatus.draft,
        pdf_url=pdf_url,
        lang=lang,
    )
    db.add(agreement)
    db.commit()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.get("/{company_id}/agreements", response_model=List[AgreementOut])
def list_agreements(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all agreement versions for a company."""
    _get_company_or_404(company_id, current_user, db)
    return db.query(Agreement).filter(
        Agreement.company_id == company_id
    ).order_by(Agreement.version.desc()).all()