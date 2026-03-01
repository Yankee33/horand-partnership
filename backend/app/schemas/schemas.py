from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import EntityType, IncomeType


# ── Auth ──────────────────────────────────────────────
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── CoOwner ───────────────────────────────────────────
class CoOwnerCreate(BaseModel):
    full_name: str
    share: float
    position: int


class CoOwnerOut(BaseModel):
    id: int
    full_name: str
    share: float
    photo_url: Optional[str] = None
    position: int

    class Config:
        from_attributes = True


# ── IncomeRule ────────────────────────────────────────
class IncomeRuleCreate(BaseModel):
    co_owner_id: int
    income_type: IncomeType
    share: float


class IncomeRuleOut(BaseModel):
    id: int
    co_owner_id: int
    income_type: IncomeType
    share: float

    class Config:
        from_attributes = True


# ── Company ───────────────────────────────────────────
class CompanyCreate(BaseModel):
    name: str
    entity_type: EntityType = EntityType.company
    co_owners: List[CoOwnerCreate]
    income_rules: Optional[List[IncomeRuleCreate]] = []


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    entity_type: Optional[EntityType] = None
    contract_confirmed: Optional[bool] = None


class CompanyOut(BaseModel):
    id: int
    name: str
    entity_type: EntityType
    contract_confirmed: bool
    created_at: datetime
    co_owners: List[CoOwnerOut] = []
    income_rules: List[IncomeRuleOut] = []

    class Config:
        from_attributes = True


# ── Agreement ─────────────────────────────────────────
class AgreementOut(BaseModel):
    id: int
    company_id: int
    version: int
    status: str
    pdf_url: Optional[str] = None
    lang: str
    created_at: datetime

    class Config:
        from_attributes = True