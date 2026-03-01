"""
Seed script — creates test data for quick demo.

Usage (from backend/ folder):
    python seed.py

Creates:
    - 2 users (admin + demo)
    - 2 companies with co-owners and income rules
    - Confirmed contract for first company

Login credentials after seed:
    admin@horand.com / admin123
    demo@horand.com  / demo123
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models.models import Base, User, Company, CoOwner, IncomeRule, EntityType, IncomeType
from app.services.auth import hash_password

# ── Recreate tables ───────────────────────────────────
Base.metadata.create_all(bind=engine)

db = SessionLocal()


def clear_data():
    """Remove existing seed data if present."""
    for email in ["admin@horand.com", "demo@horand.com"]:
        user = db.query(User).filter(User.email == email).first()
        if user:
            for company in user.companies:
                db.delete(company)
            db.delete(user)
    db.commit()


def create_user(full_name: str, email: str, password: str) -> User:
    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.flush()
    print(f"  ✓ User: {email} / {password}")
    return user


def create_company(
    owner: User,
    name: str,
    entity_type: EntityType,
    co_owners_data: list,
    income_rules_data: list,
    contract_confirmed: bool = False,
) -> Company:
    company = Company(
        name=name,
        entity_type=entity_type,
        owner_id=owner.id,
        contract_confirmed=contract_confirmed,
    )
    db.add(company)
    db.flush()

    # Create co-owners
    co_owner_objects = []
    for data in co_owners_data:
        co = CoOwner(
            company_id=company.id,
            full_name=data["full_name"],
            share=data["share"],
            position=data["position"],
        )
        db.add(co)
        db.flush()
        co_owner_objects.append(co)
        print(f"    → Co-owner: {co.full_name} ({co.share}%)")

    # Create income rules
    for rule_data in income_rules_data:
        co = co_owner_objects[rule_data["co_owner_index"]]
        rule = IncomeRule(
            company_id=company.id,
            co_owner_id=co.id,
            income_type=rule_data["income_type"],
            share=rule_data["share"],
        )
        db.add(rule)

    print(f"  ✓ Company: «{name}» (contract_confirmed={contract_confirmed})")
    return company


def run():
    print("\n🌱 Seeding database...\n")
    clear_data()

    # ── User 1: Admin ─────────────────────────────────
    print("👤 Creating users:")
    admin = create_user("Олексій Бондаренко", "admin@horand.com", "admin123")
    demo  = create_user("Марія Коваленко",    "demo@horand.com",  "demo123")

    # ── Company 1: IT компанія (підтверджений договір) ─
    print("\n🏢 Creating companies:")
    create_company(
        owner=admin,
        name="TechStart UA",
        entity_type=EntityType.company,
        co_owners_data=[
            {"full_name": "Олексій Бондаренко", "share": 60.0, "position": 1},
            {"full_name": "Іван Мельник",        "share": 40.0, "position": 2},
        ],
        income_rules_data=[
            {"co_owner_index": 0, "income_type": IncomeType.project, "share": 60.0},
            {"co_owner_index": 1, "income_type": IncomeType.project, "share": 40.0},
            {"co_owner_index": 0, "income_type": IncomeType.profit,  "share": 60.0},
            {"co_owner_index": 1, "income_type": IncomeType.profit,  "share": 40.0},
            {"co_owner_index": 0, "income_type": IncomeType.clients, "share": 50.0},
            {"co_owner_index": 1, "income_type": IncomeType.clients, "share": 50.0},
        ],
        contract_confirmed=True,
    )

    # ── Company 2: Проєкт (без підтвердженого договору) ─
    create_company(
        owner=admin,
        name="GreenApp Project",
        entity_type=EntityType.project,
        co_owners_data=[
            {"full_name": "Олексій Бондаренко", "share": 50.0, "position": 1},
            {"full_name": "Марія Коваленко",    "share": 30.0, "position": 2},
            {"full_name": "Петро Сидоренко",    "share": 20.0, "position": 3},
        ],
        income_rules_data=[
            {"co_owner_index": 0, "income_type": IncomeType.profit, "share": 50.0},
            {"co_owner_index": 1, "income_type": IncomeType.profit, "share": 30.0},
            {"co_owner_index": 2, "income_type": IncomeType.profit, "share": 20.0},
        ],
        contract_confirmed=False,
    )

    # ── Company 3: demo user ──────────────────────────
    create_company(
        owner=demo,
        name="CreativeStudio",
        entity_type=EntityType.company,
        co_owners_data=[
            {"full_name": "Марія Коваленко",  "share": 70.0, "position": 1},
            {"full_name": "Андрій Лисенко",   "share": 30.0, "position": 2},
        ],
        income_rules_data=[
            {"co_owner_index": 0, "income_type": IncomeType.project, "share": 70.0},
            {"co_owner_index": 1, "income_type": IncomeType.project, "share": 30.0},
            {"co_owner_index": 0, "income_type": IncomeType.profit,  "share": 70.0},
            {"co_owner_index": 1, "income_type": IncomeType.profit,  "share": 30.0},
        ],
        contract_confirmed=True,
    )

    db.commit()

    print("\n✅ Seed complete!\n")
    print("=" * 40)
    print("  Login credentials:")
    print("  admin@horand.com  /  admin123  (2 companies)")
    print("  demo@horand.com   /  demo123   (1 company)")
    print("=" * 40)
    print()


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()
