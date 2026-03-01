from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class EntityType(str, enum.Enum):
    company = "company"
    project = "project"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    companies = relationship("Company", back_populates="owner")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    entity_type = Column(Enum(EntityType), default=EntityType.company)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contract_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="companies")
    co_owners = relationship("CoOwner", back_populates="company", cascade="all, delete-orphan")
    income_rules = relationship("IncomeRule", back_populates="company", cascade="all, delete-orphan")
    agreements = relationship("Agreement", back_populates="company", cascade="all, delete-orphan")


class CoOwner(Base):
    __tablename__ = "co_owners"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    full_name = Column(String, nullable=False)
    share = Column(Float, nullable=False)
    photo_url = Column(String, nullable=True)
    position = Column(Integer, nullable=False)  # order index

    company = relationship("Company", back_populates="co_owners")
    income_rules = relationship("IncomeRule", back_populates="co_owner")


class IncomeType(str, enum.Enum):
    project = "project"
    clients = "clients"
    profit = "profit"


class IncomeRule(Base):
    __tablename__ = "income_rules"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    co_owner_id = Column(Integer, ForeignKey("co_owners.id"), nullable=False)
    income_type = Column(Enum(IncomeType), nullable=False)
    share = Column(Float, nullable=False)

    company = relationship("Company", back_populates="income_rules")
    co_owner = relationship("CoOwner", back_populates="income_rules")


class AgreementStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"


class Agreement(Base):
    __tablename__ = "agreements"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    version = Column(Integer, default=1, nullable=False)
    status = Column(Enum(AgreementStatus), default=AgreementStatus.draft)
    pdf_url = Column(String, nullable=True)   # path or URL to saved PDF
    lang = Column(String, default="ua")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="agreements")