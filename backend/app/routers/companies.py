from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.database import get_db
from app.models.models import User, Company, CoOwner, IncomeRule
from app.schemas.schemas import CompanyCreate, CompanyOut, CompanyUpdate, IncomeRuleCreate
from app.services.auth import get_current_user
from app.services.upload import save_photo

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("/", response_model=List[CompanyOut])
def get_companies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Company).filter(Company.owner_id == current_user.id).all()


@router.post("/", response_model=CompanyOut, status_code=201)
def create_company(data: CompanyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company = Company(
        name=data.name,
        entity_type=data.entity_type,
        owner_id=current_user.id,
    )
    db.add(company)
    db.flush()

    # Add co-owners
    co_owner_map = {}
    for co_data in data.co_owners:
        co = CoOwner(
            company_id=company.id,
            full_name=co_data.full_name,
            share=co_data.share,
            position=co_data.position,
        )
        db.add(co)
        db.flush()
        co_owner_map[co_data.position] = co.id

    # Add income rules
    for rule_data in (data.income_rules or []):
        rule = IncomeRule(
            company_id=company.id,
            co_owner_id=rule_data.co_owner_id,
            income_type=rule_data.income_type,
            share=rule_data.share,
        )
        db.add(rule)

    db.commit()
    db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == company_id, Company.owner_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(company_id: int, data: CompanyUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == company_id, Company.owner_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == company_id, Company.owner_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()


@router.post("/{company_id}/co-owners/{co_owner_id}/photo", response_model=dict)
async def upload_photo(
    company_id: int,
    co_owner_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = db.query(Company).filter(Company.id == company_id, Company.owner_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    co = db.query(CoOwner).filter(CoOwner.id == co_owner_id, CoOwner.company_id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Co-owner not found")

    url = await save_photo(file, subfolder="co-owners")
    co.photo_url = url
    db.commit()
    return {"photo_url": url}


@router.put("/{company_id}/income-rules", response_model=CompanyOut)
def update_income_rules(
    company_id: int,
    rules: List[IncomeRuleCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = db.query(Company).filter(Company.id == company_id, Company.owner_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    db.query(IncomeRule).filter(IncomeRule.company_id == company_id).delete()
    for rule_data in rules:
        rule = IncomeRule(company_id=company_id, **rule_data.model_dump())
        db.add(rule)

    db.commit()
    db.refresh(company)
    return company
