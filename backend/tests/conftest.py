"""
Test configuration and fixtures.
Uses a separate SQLite database for tests (no PostgreSQL required).
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from main import app

# ── In-memory SQLite for tests ────────────────────────
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """FastAPI test client with DB override."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def registered_user(client):
    """Create and return a registered user + token."""
    res = client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "password123",
    })
    assert res.status_code == 201

    login = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    token = login.json()["access_token"]
    return {"token": token, "user": res.json()}


@pytest.fixture
def auth_headers(registered_user):
    """Return Authorization headers for authenticated requests."""
    return {"Authorization": f"Bearer {registered_user['token']}"}
