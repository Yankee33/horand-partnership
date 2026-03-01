"""
Tests for authentication endpoints.
Covers: registration, login, token validation, error cases.
"""


class TestRegistration:
    def test_register_success(self, client):
        """User can register with valid data."""
        res = client.post("/api/auth/register", json={
            "full_name": "John Doe",
            "email": "john@example.com",
            "password": "secret123",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == "john@example.com"
        assert data["full_name"] == "John Doe"
        assert "id" in data
        assert "hashed_password" not in data  # password must not be exposed

    def test_register_duplicate_email(self, client):
        """Cannot register twice with the same email."""
        payload = {"full_name": "User", "email": "dup@example.com", "password": "pass123"}
        client.post("/api/auth/register", json=payload)
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        """Invalid email format is rejected."""
        res = client.post("/api/auth/register", json={
            "full_name": "User",
            "email": "not-an-email",
            "password": "pass123",
        })
        assert res.status_code == 422  # Pydantic validation error


class TestLogin:
    def test_login_success(self, client, registered_user):
        """User can login with correct credentials."""
        res = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 10

    def test_login_wrong_password(self, client, registered_user):
        """Login fails with wrong password."""
        res = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword",
        })
        assert res.status_code == 401
        assert "invalid" in res.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Login fails for non-existent user."""
        res = client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "password123",
        })
        assert res.status_code == 401

    def test_get_me_authenticated(self, client, registered_user, auth_headers):
        """Authenticated user can get their profile."""
        res = client.get("/api/auth/me", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["email"] == "test@example.com"

    def test_get_me_unauthenticated(self, client):
        """Unauthenticated request to /me returns 401."""
        res = client.get("/api/auth/me")
        assert res.status_code == 401

    def test_get_me_invalid_token(self, client):
        """Invalid token returns 401."""
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert res.status_code == 401
