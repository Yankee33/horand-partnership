"""
Tests for company creation, retrieval, update and contract confirmation.
Covers: CRUD operations, ownership isolation, contract flow.
"""


class TestCompanyCreation:
    def test_create_company(self, client, auth_headers):
        """Company is created with co-owners."""
        res = client.post("/api/companies/", json={
            "name": "HORAND LLC",
            "entity_type": "company",
            "co_owners": [
                {"full_name": "Alice", "share": 60.0, "position": 1},
                {"full_name": "Bob",   "share": 40.0, "position": 2},
            ],
            "income_rules": [],
        }, headers=auth_headers)

        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "HORAND LLC"
        assert data["entity_type"] == "company"
        assert data["contract_confirmed"] is False
        assert len(data["co_owners"]) == 2

    def test_create_project(self, client, auth_headers):
        """Entity type 'project' is supported."""
        res = client.post("/api/companies/", json={
            "name": "My Project",
            "entity_type": "project",
            "co_owners": [
                {"full_name": "Alice", "share": 50.0, "position": 1},
                {"full_name": "Bob",   "share": 50.0, "position": 2},
            ],
            "income_rules": [],
        }, headers=auth_headers)
        assert res.status_code == 201
        assert res.json()["entity_type"] == "project"

    def test_create_requires_auth(self, client):
        """Cannot create company without authentication."""
        res = client.post("/api/companies/", json={
            "name": "No Auth",
            "entity_type": "company",
            "co_owners": [],
            "income_rules": [],
        })
        assert res.status_code == 401

    def test_list_companies(self, client, auth_headers):
        """User can list their companies."""
        client.post("/api/companies/", json={
            "name": "Company A", "entity_type": "company",
            "co_owners": [{"full_name": "A", "share": 50.0, "position": 1},
                          {"full_name": "B", "share": 50.0, "position": 2}],
            "income_rules": [],
        }, headers=auth_headers)
        client.post("/api/companies/", json={
            "name": "Company B", "entity_type": "project",
            "co_owners": [{"full_name": "C", "share": 50.0, "position": 1},
                          {"full_name": "D", "share": 50.0, "position": 2}],
            "income_rules": [],
        }, headers=auth_headers)

        res = client.get("/api/companies/", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_get_company_by_id(self, client, auth_headers):
        """Can retrieve specific company by ID."""
        create_res = client.post("/api/companies/", json={
            "name": "Specific Co", "entity_type": "company",
            "co_owners": [{"full_name": "A", "share": 50.0, "position": 1},
                          {"full_name": "B", "share": 50.0, "position": 2}],
            "income_rules": [],
        }, headers=auth_headers)
        company_id = create_res.json()["id"]

        res = client.get(f"/api/companies/{company_id}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["name"] == "Specific Co"

    def test_cannot_access_other_users_company(self, client, auth_headers):
        """User cannot access another user's company."""
        # Create company as first user
        create_res = client.post("/api/companies/", json={
            "name": "Private Co", "entity_type": "company",
            "co_owners": [{"full_name": "A", "share": 50.0, "position": 1},
                          {"full_name": "B", "share": 50.0, "position": 2}],
            "income_rules": [],
        }, headers=auth_headers)
        company_id = create_res.json()["id"]

        # Register second user
        client.post("/api/auth/register", json={
            "full_name": "Other User",
            "email": "other@example.com",
            "password": "password123",
        })
        login2 = client.post("/api/auth/login", json={
            "email": "other@example.com",
            "password": "password123",
        })
        other_headers = {"Authorization": f"Bearer {login2.json()['access_token']}"}

        # Second user should not see first user's company
        res = client.get(f"/api/companies/{company_id}", headers=other_headers)
        assert res.status_code == 404


class TestContractConfirmation:
    def test_confirm_contract(self, client, auth_headers):
        """Contract can be confirmed via PATCH."""
        create_res = client.post("/api/companies/", json={
            "name": "Contract Co", "entity_type": "company",
            "co_owners": [{"full_name": "A", "share": 50.0, "position": 1},
                          {"full_name": "B", "share": 50.0, "position": 2}],
            "income_rules": [],
        }, headers=auth_headers)
        company_id = create_res.json()["id"]
        assert create_res.json()["contract_confirmed"] is False

        res = client.patch(
            f"/api/companies/{company_id}",
            json={"contract_confirmed": True},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.json()["contract_confirmed"] is True

    def test_delete_company(self, client, auth_headers):
        """Company can be deleted."""
        create_res = client.post("/api/companies/", json={
            "name": "To Delete", "entity_type": "company",
            "co_owners": [{"full_name": "A", "share": 50.0, "position": 1},
                          {"full_name": "B", "share": 50.0, "position": 2}],
            "income_rules": [],
        }, headers=auth_headers)
        company_id = create_res.json()["id"]

        del_res = client.delete(f"/api/companies/{company_id}", headers=auth_headers)
        assert del_res.status_code == 204

        get_res = client.get(f"/api/companies/{company_id}", headers=auth_headers)
        assert get_res.status_code == 404
